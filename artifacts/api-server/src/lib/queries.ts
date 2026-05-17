import { desc, sql, eq } from "drizzle-orm";
import {
  db,
  playersTable,
  activitiesTable,
  seasonsTable,
  type Player as DbPlayer,
} from "@workspace/db";
import {
  rankTierForLevel,
  levelFromTotalXp,
  type RankTier,
} from "./progression";

export async function getServerRankFor(playerId: number): Promise<number> {
  const all = await db
    .select({ id: playersTable.id, totalXp: playersTable.totalXp })
    .from(playersTable)
    .orderBy(desc(playersTable.totalXp));
  const idx = all.findIndex((p) => p.id === playerId);
  return idx === -1 ? all.length : idx + 1;
}

export type LeaderboardKind =
  | "xp"
  | "gta_missions"
  | "gta_heists"
  | "rl_matches"
  | "rl_wins";

const LEADERBOARD_LABELS: Record<
  LeaderboardKind,
  { label: string; valueLabel: string }
> = {
  xp: { label: "Global XP", valueLabel: "XP" },
  gta_missions: { label: "GTA Missions", valueLabel: "Missions" },
  gta_heists: { label: "GTA Heists", valueLabel: "Heists" },
  rl_matches: { label: "Rocket League Matches", valueLabel: "Matches" },
  rl_wins: { label: "Rocket League Wins", valueLabel: "Wins" },
};

export function leaderboardLabels(kind: LeaderboardKind) {
  return LEADERBOARD_LABELS[kind];
}

export async function getTopLeaderboard(
  kind: LeaderboardKind,
  limit: number,
  meId: number,
) {
  const all = await db.select().from(playersTable);
  const valued = all.map((p) => ({
    p,
    value: extractMetric(p, kind),
  }));
  valued.sort((a, b) => b.value - a.value);
  const top = valued.slice(0, limit);
  return top.map((row, i) => {
    const lvl = levelFromTotalXp(row.p.totalXp);
    return {
      rank: i + 1,
      playerId: row.p.id,
      username: row.p.username,
      avatarUrl: row.p.avatarUrl,
      level: lvl.level,
      rankTier: rankTierForLevel(lvl.level) as RankTier,
      value: row.value,
      isMe: row.p.id === meId,
    };
  });
}

function extractMetric(p: DbPlayer, kind: LeaderboardKind): number {
  switch (kind) {
    case "xp":
      return p.totalXp;
    case "gta_missions":
      return p.gameStats.gtaMissions;
    case "gta_heists":
      return p.gameStats.gtaHeists;
    case "rl_matches":
      return p.gameStats.rlMatches;
    case "rl_wins":
      return p.gameStats.rlWins;
  }
}

export async function getServerTotals() {
  const players = await db.select().from(playersTable);
  const [acts] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(activitiesTable);
  const totalXpEarned = players.reduce((acc, p) => acc + p.totalXp, 0);
  const topLevel = players.reduce(
    (acc, p) => Math.max(acc, levelFromTotalXp(p.totalXp).level),
    0,
  );
  return {
    totalPlayers: players.length,
    totalXpEarned,
    totalActivitiesLogged: acts?.count ?? 0,
    topRankTier: rankTierForLevel(topLevel),
  };
}

export async function getCurrentSeasonProgress(me: DbPlayer) {
  const [season] = await db
    .select()
    .from(seasonsTable)
    .where(eq(seasonsTable.isActive, true))
    .limit(1);

  if (!season) {
    const now = new Date();
    return {
      id: 0,
      name: "No Active Season",
      tagline: "A new season is brewing",
      startsAt: now,
      endsAt: now,
      daysRemaining: 0,
      seasonXp: 0,
      seasonTier: 0,
      nextTierXp: 0,
      progressPct: 0,
      rewards: [],
    };
  }

  const now = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((season.endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const seasonStart = season.startsAt.getTime();
  const myActivities = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.playerId, me.id));
  const seasonXp = myActivities
    .filter((a) => a.createdAt.getTime() >= seasonStart)
    .reduce((acc, a) => acc + a.xpGained, 0);

  const xpPerTier = season.xpPerTier;
  const seasonTier = Math.floor(seasonXp / xpPerTier);
  const intoTier = seasonXp - seasonTier * xpPerTier;
  const progressPct = (intoTier / xpPerTier) * 100;

  const rewards = season.rewards.map((r) => ({
    tier: r.tier,
    name: r.name,
    kind: r.kind,
    amount: r.amount,
    unlocked: seasonTier >= r.tier,
  }));

  return {
    id: season.id,
    name: season.name,
    tagline: season.tagline,
    startsAt: season.startsAt,
    endsAt: season.endsAt,
    daysRemaining,
    seasonXp,
    seasonTier,
    nextTierXp: xpPerTier,
    progressPct,
    rewards,
  };
}
