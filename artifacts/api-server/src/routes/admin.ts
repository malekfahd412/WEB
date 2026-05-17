import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, playersTable, activitiesTable } from "@workspace/db";
import {
  AdminAddXpBody,
  AdminAddXpResponse,
  AdminAddCoinsBody,
  AdminAddCoinsResponse,
  AdminSetRockstarIdBody,
  AdminSetRockstarIdResponse,
} from "@workspace/api-zod";
import { requireBot } from "../middleware/requireBot";
import { levelFromTotalXp, toPlayerView } from "../lib/progression";
import { getServerRankFor } from "../lib/queries";

const router: IRouter = Router();

router.use("/admin", requireBot);

const UpsertPlayerBody = z.object({
  discordId: z.string().min(1),
  discordUsername: z.string().min(1),
  discordAvatar: z.string().nullish(),
  discordDiscriminator: z.string().nullish(),
});

function handleFromDiscord(username: string, discordId: string) {
  const cleaned = username.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 16);
  const tail = discordId.slice(-4);
  const base = cleaned || "player";
  return `${base}_${tail}`;
}

function avatarUrl(discordId: string, hash: string | null | undefined) {
  if (hash) {
    return `https://cdn.discordapp.com/avatars/${discordId}/${hash}.png`;
  }
  const idx = Number(BigInt(discordId) % 5n);
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

async function findByDiscordId(discordId: string) {
  const [p] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.discordId, discordId))
    .limit(1);
  return p;
}

router.post("/admin/add-xp", async (req, res): Promise<void> => {
  const parsed = AdminAddXpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { discordId, amount } = parsed.data;
  const player = await findByDiscordId(discordId);
  if (!player) {
    res.status(404).json({ error: "Player not found for that Discord ID" });
    return;
  }
  const beforeLevel = levelFromTotalXp(player.totalXp).level;
  const newTotalXp = Math.max(0, player.totalXp + amount);
  const afterLevel = levelFromTotalXp(newTotalXp).level;
  const [updated] = await db
    .update(playersTable)
    .set({ totalXp: newTotalXp, level: afterLevel, lastActiveAt: new Date() })
    .where(eq(playersTable.id, player.id))
    .returning();
  await db.insert(activitiesTable).values({
    playerId: player.id,
    type: amount >= 0 ? "level_up" : "level_up",
    xpGained: amount,
    coinsGained: 0,
  });
  if (afterLevel > beforeLevel) {
    // already noted above
  }
  const rank = await getServerRankFor(updated.id);
  res.json(AdminAddXpResponse.parse(toPlayerView(updated, rank)));
});

router.post("/admin/add-coins", async (req, res): Promise<void> => {
  const parsed = AdminAddCoinsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { discordId, amount } = parsed.data;
  const player = await findByDiscordId(discordId);
  if (!player) {
    res.status(404).json({ error: "Player not found for that Discord ID" });
    return;
  }
  const newCoins = Math.max(0, player.coins + amount);
  const [updated] = await db
    .update(playersTable)
    .set({ coins: newCoins, lastActiveAt: new Date() })
    .where(eq(playersTable.id, player.id))
    .returning();
  await db.insert(activitiesTable).values({
    playerId: player.id,
    type: "daily_reward",
    xpGained: 0,
    coinsGained: amount,
  });
  const rank = await getServerRankFor(updated.id);
  res.json(AdminAddCoinsResponse.parse(toPlayerView(updated, rank)));
});

router.post("/admin/upsert-player", async (req, res): Promise<void> => {
  const parsed = UpsertPlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { discordId, discordUsername, discordAvatar, discordDiscriminator } =
    parsed.data;
  const existing = await findByDiscordId(discordId);
  if (existing) {
    const [updated] = await db
      .update(playersTable)
      .set({
        discordUsername,
        discordAvatar: discordAvatar ?? existing.discordAvatar,
        discordDiscriminator:
          discordDiscriminator ?? existing.discordDiscriminator,
        avatarUrl: avatarUrl(discordId, discordAvatar ?? existing.discordAvatar),
        lastActiveAt: new Date(),
      })
      .where(eq(playersTable.id, existing.id))
      .returning();
    const rank = await getServerRankFor(updated.id);
    res.json(toPlayerView(updated, rank));
    return;
  }
  const handle = handleFromDiscord(discordUsername, discordId);
  const [created] = await db
    .insert(playersTable)
    .values({
      discordId,
      discordUsername,
      discordAvatar: discordAvatar ?? null,
      discordDiscriminator: discordDiscriminator ?? null,
      username: discordUsername,
      handle,
      avatarUrl: avatarUrl(discordId, discordAvatar),
      lastLoginAt: new Date(),
    })
    .returning();
  const rank = await getServerRankFor(created.id);
  res.json(toPlayerView(created, rank));
});

router.get("/admin/player-by-discord/:discordId", async (req, res): Promise<void> => {
  const discordId = String(req.params["discordId"] ?? "");
  if (!discordId) {
    res.status(400).json({ error: "discordId is required" });
    return;
  }
  const player = await findByDiscordId(discordId);
  if (!player) {
    res.status(404).json({ error: "Player not found for that Discord ID" });
    return;
  }
  const rank = await getServerRankFor(player.id);
  res.json(toPlayerView(player, rank));
});

router.post("/admin/set-rockstar-id", async (req, res): Promise<void> => {
  const parsed = AdminSetRockstarIdBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { discordId, rockstarId } = parsed.data;
  const player = await findByDiscordId(discordId);
  if (!player) {
    res.status(404).json({ error: "Player not found for that Discord ID" });
    return;
  }
  const [updated] = await db
    .update(playersTable)
    .set({ rockstarId })
    .where(eq(playersTable.id, player.id))
    .returning();
  const rank = await getServerRankFor(updated.id);
  res.json(AdminSetRockstarIdResponse.parse(toPlayerView(updated, rank)));
});

export default router;
