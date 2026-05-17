import { Router, type IRouter } from "express";
import { eq, desc, gt } from "drizzle-orm";
import {
  db,
  playersTable,
  activitiesTable,
  inventoryTable,
  shopItemsTable,
  type Player as DbPlayer,
} from "@workspace/db";
import {
  GetMeResponse,
  GetDashboardResponse,
  SetRockstarIdBody,
  SetRockstarIdResponse,
  LogActivityBody,
  LogActivityResponse,
  GetInventoryResponse,
  EquipItemBody,
  EquipItemResponse,
  ClaimDailyRewardResponse,
  ListMyActivitiesQueryParams,
  ListMyActivitiesResponse,
} from "@workspace/api-zod";
import {
  ACTIVITY_REWARDS,
  applyAttributeBumps,
  levelFromTotalXp,
  toPlayerView,
  type GameplayActivityType,
} from "../lib/progression";
import {
  getCurrentSeasonProgress,
  getServerRankFor,
  getTopLeaderboard,
  getServerTotals,
} from "../lib/queries";
import { requireAuth, getAuthedPlayer } from "../middleware/requireAuth";

const router: IRouter = Router();

// All /me/* routes require an authenticated session.
router.use("/me", requireAuth);

async function getMePlayer(req: import("express").Request): Promise<DbPlayer> {
  return getAuthedPlayer(req);
}

router.get("/me", async (req, res): Promise<void> => {
  const me = await getMePlayer(req);
  const rank = await getServerRankFor(me.id);
  const view = toPlayerView(me, rank);
  res.json(GetMeResponse.parse(view));
});

router.get("/me/dashboard", async (req, res): Promise<void> => {
  const me = await getMePlayer(req);
  const rank = await getServerRankFor(me.id);
  const player = toPlayerView(me, rank);

  const recent = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.playerId, me.id))
    .orderBy(desc(activitiesTable.createdAt))
    .limit(8);

  const top = await getTopLeaderboard("xp", 5, me.id);
  const totals = await getServerTotals();
  const season = await getCurrentSeasonProgress(me);

  res.json(
    GetDashboardResponse.parse({
      player,
      recentActivities: recent.map((a) => ({
        id: a.id,
        type: a.type,
        xpGained: a.xpGained,
        coinsGained: a.coinsGained,
        createdAt: a.createdAt,
      })),
      topPlayers: top,
      totals,
      season,
    }),
  );
});

router.patch("/me/rockstar-id", async (req, res): Promise<void> => {
  const parsed = SetRockstarIdBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const me = await getMePlayer(req);
  const [updated] = await db
    .update(playersTable)
    .set({ rockstarId: parsed.data.rockstarId })
    .where(eq(playersTable.id, me.id))
    .returning();
  const rank = await getServerRankFor(updated.id);
  res.json(SetRockstarIdResponse.parse(toPlayerView(updated, rank)));
});

router.post("/me/activity", async (req, res): Promise<void> => {
  const parsed = LogActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const type = parsed.data.type as GameplayActivityType;
  const reward = ACTIVITY_REWARDS[type];
  if (!reward) {
    res.status(400).json({ error: "Unknown activity type" });
    return;
  }

  const me = await getMePlayer(req);
  const beforeLevel = levelFromTotalXp(me.totalXp).level;

  const newTotalXp = me.totalXp + reward.xp;
  const afterLevel = levelFromTotalXp(newTotalXp).level;
  const levelsGained = Math.max(0, afterLevel - beforeLevel);
  const bonusCoins = levelsGained * 500;

  const newCoins = me.coins + reward.coins + bonusCoins;
  const newStats = { ...me.gameStats };
  newStats[reward.statKey] = (newStats[reward.statKey] ?? 0) + 1;
  const newAttributes = applyAttributeBumps(me.attributes, reward.attributeBumps);

  const [updated] = await db
    .update(playersTable)
    .set({
      totalXp: newTotalXp,
      level: afterLevel,
      coins: newCoins,
      gameStats: newStats,
      attributes: newAttributes,
      lastActiveAt: new Date(),
    })
    .where(eq(playersTable.id, me.id))
    .returning();

  const [activity] = await db
    .insert(activitiesTable)
    .values({
      playerId: me.id,
      type,
      xpGained: reward.xp,
      coinsGained: reward.coins + bonusCoins,
    })
    .returning();

  if (levelsGained > 0) {
    await db.insert(activitiesTable).values({
      playerId: me.id,
      type: "level_up",
      xpGained: 0,
      coinsGained: bonusCoins,
    });
  }

  const rank = await getServerRankFor(updated.id);
  res.json(
    LogActivityResponse.parse({
      player: toPlayerView(updated, rank),
      xpGained: reward.xp,
      coinsGained: reward.coins + bonusCoins,
      leveledUp: levelsGained > 0,
      levelsGained,
      bonusCoins,
      activity: {
        id: activity.id,
        type: activity.type,
        xpGained: activity.xpGained,
        coinsGained: activity.coinsGained,
        createdAt: activity.createdAt,
      },
    }),
  );
});

router.get("/me/inventory", async (req, res): Promise<void> => {
  const me = await getMePlayer(req);
  const rows = await db
    .select({
      inv: inventoryTable,
      item: shopItemsTable,
    })
    .from(inventoryTable)
    .innerJoin(shopItemsTable, eq(inventoryTable.itemId, shopItemsTable.id))
    .where(eq(inventoryTable.playerId, me.id))
    .orderBy(desc(inventoryTable.acquiredAt));

  const list = rows.map((r) => ({
    item: r.item,
    acquiredAt: r.inv.acquiredAt,
    equipped:
      (r.item.category === "frame" && me.equippedFrameId === r.item.id) ||
      (r.item.category === "badge" && me.equippedBadgeId === r.item.id),
  }));

  res.json(GetInventoryResponse.parse(list));
});

router.post("/me/equip", async (req, res): Promise<void> => {
  const parsed = EquipItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const me = await getMePlayer(req);
  const [item] = await db
    .select()
    .from(shopItemsTable)
    .where(eq(shopItemsTable.id, parsed.data.itemId));
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  const [owned] = await db
    .select()
    .from(inventoryTable)
    .where(eq(inventoryTable.itemId, item.id));
  if (!owned || owned.playerId !== me.id) {
    res.status(400).json({ error: "Item not owned" });
    return;
  }

  const update: Partial<typeof playersTable.$inferInsert> = {};
  if (item.category === "frame") {
    update.equippedFrameId = item.id;
  } else if (item.category === "badge") {
    update.equippedBadgeId = item.id;
  } else {
    res.status(400).json({ error: "Item is not equippable" });
    return;
  }

  const [updated] = await db
    .update(playersTable)
    .set(update)
    .where(eq(playersTable.id, me.id))
    .returning();
  const rank = await getServerRankFor(updated.id);
  res.json(EquipItemResponse.parse(toPlayerView(updated, rank)));
});

router.post("/me/daily-reward", async (req, res): Promise<void> => {
  const me = await getMePlayer(req);
  const now = new Date();
  const last = me.lastDailyClaimAt ? new Date(me.lastDailyClaimAt) : null;
  const dayMs = 24 * 60 * 60 * 1000;
  const sinceMs = last ? now.getTime() - last.getTime() : Infinity;

  if (last && sinceMs < dayMs) {
    const nextClaimAt = new Date(last.getTime() + dayMs);
    const rank = await getServerRankFor(me.id);
    res.json(
      ClaimDailyRewardResponse.parse({
        claimed: false,
        coinsGained: 0,
        xpGained: 0,
        streakDays: me.streakDays,
        nextClaimAt,
        player: toPlayerView(me, rank),
      }),
    );
    return;
  }

  const newStreak = last && sinceMs < dayMs * 2 ? me.streakDays + 1 : 1;
  const baseCoins = 100;
  const baseXp = 50;
  const streakBonus = Math.min(newStreak - 1, 9);
  const coinsGained = baseCoins + streakBonus * 25;
  const xpGained = baseXp + streakBonus * 15;

  const [updated] = await db
    .update(playersTable)
    .set({
      coins: me.coins + coinsGained,
      totalXp: me.totalXp + xpGained,
      streakDays: newStreak,
      lastDailyClaimAt: now,
      lastActiveAt: now,
    })
    .where(eq(playersTable.id, me.id))
    .returning();

  await db.insert(activitiesTable).values({
    playerId: me.id,
    type: "daily_reward",
    xpGained,
    coinsGained,
  });

  const rank = await getServerRankFor(updated.id);
  const nextClaimAt = new Date(now.getTime() + dayMs);
  res.json(
    ClaimDailyRewardResponse.parse({
      claimed: true,
      coinsGained,
      xpGained,
      streakDays: newStreak,
      nextClaimAt,
      player: toPlayerView(updated, rank),
    }),
  );
});

router.get("/me/activities", async (req, res): Promise<void> => {
  const parsed = ListMyActivitiesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const me = await getMePlayer(req);
  const limit = parsed.data.limit ?? 20;
  const rows = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.playerId, me.id))
    .orderBy(desc(activitiesTable.createdAt))
    .limit(limit);

  res.json(
    ListMyActivitiesResponse.parse(
      rows.map((a) => ({
        id: a.id,
        type: a.type,
        xpGained: a.xpGained,
        coinsGained: a.coinsGained,
        createdAt: a.createdAt,
      })),
    ),
  );
});

// Re-export a marker to satisfy unused import warnings.
export const _gtPlaceholder = gt;

export default router;
