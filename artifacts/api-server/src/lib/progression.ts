import type {
  AttributesJson,
  GameStatsJson,
  Player as DbPlayer,
} from "@workspace/db";

const BASE_XP_REQUIREMENT = 100;
const PROGRESSION_MULTIPLIER = 1.35;

export type RankTier =
  | "ROOKIE"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND"
  | "MYTHIC";

export type ActivityType =
  | "gta_mission"
  | "gta_heist"
  | "rl_match"
  | "rl_win"
  | "daily_reward"
  | "level_up";

export type GameplayActivityType =
  | "gta_mission"
  | "gta_heist"
  | "rl_match"
  | "rl_win";

export const ACTIVITY_REWARDS: Record<
  GameplayActivityType,
  {
    xp: number;
    coins: number;
    statKey: keyof GameStatsJson;
    attributeBumps: Partial<AttributesJson>;
  }
> = {
  gta_mission: {
    xp: 150,
    coins: 19,
    statKey: "gtaMissions",
    attributeBumps: { focus: 1, strength: 1 },
  },
  gta_heist: {
    xp: 300,
    coins: 38,
    statKey: "gtaHeists",
    attributeBumps: { unity: 1, strength: 1, victory: 1 },
  },
  rl_match: {
    xp: 90,
    coins: 11,
    statKey: "rlMatches",
    attributeBumps: { passion: 1, focus: 1 },
  },
  rl_win: {
    xp: 220,
    coins: 28,
    statKey: "rlWins",
    attributeBumps: { honor: 1, victory: 1, unity: 1 },
  },
};

export function xpForLevel(level: number): number {
  return Math.floor(
    BASE_XP_REQUIREMENT * Math.pow(PROGRESSION_MULTIPLIER, level),
  );
}

export function totalXpToReachLevel(level: number): number {
  let total = 0;
  for (let i = 0; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

export function levelFromTotalXp(totalXp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  levelProgressPct: number;
} {
  let level = 0;
  let cumulative = 0;
  while (true) {
    const need = xpForLevel(level);
    if (cumulative + need > totalXp) {
      const currentLevelXp = totalXp - cumulative;
      const pct = need > 0 ? (currentLevelXp / need) * 100 : 0;
      return {
        level,
        currentLevelXp,
        nextLevelXp: need,
        levelProgressPct: Math.max(0, Math.min(100, pct)),
      };
    }
    cumulative += need;
    level += 1;
    if (level > 999) break;
  }
  return { level, currentLevelXp: 0, nextLevelXp: xpForLevel(level), levelProgressPct: 0 };
}

export function rankTierForLevel(level: number): RankTier {
  if (level >= 70) return "MYTHIC";
  if (level >= 50) return "DIAMOND";
  if (level >= 35) return "PLATINUM";
  if (level >= 22) return "GOLD";
  if (level >= 12) return "SILVER";
  if (level >= 5) return "BRONZE";
  return "ROOKIE";
}

export type PlayerView = {
  id: number;
  username: string;
  handle: string;
  avatarUrl: string;
  rockstarId: string | null;
  discordId: string | null;
  discordUsername: string | null;
  discordAvatar: string | null;
  discordDiscriminator: string | null;
  totalXp: number;
  level: number;
  coins: number;
  rankTier: RankTier;
  currentLevelXp: number;
  nextLevelXp: number;
  levelProgressPct: number;
  serverRank: number;
  gameStats: GameStatsJson;
  attributes: AttributesJson;
  equipped: { frameId: number | null; badgeId: number | null };
  streakDays: number;
  lastActiveAt: Date;
  joinedAt: Date;
};

export function toPlayerView(
  p: DbPlayer,
  serverRank: number,
): PlayerView {
  const lvl = levelFromTotalXp(p.totalXp);
  return {
    id: p.id,
    username: p.username,
    handle: p.handle,
    avatarUrl: p.avatarUrl,
    rockstarId: p.rockstarId ?? null,
    discordId: p.discordId ?? null,
    discordUsername: p.discordUsername ?? null,
    discordAvatar: p.discordAvatar ?? null,
    discordDiscriminator: p.discordDiscriminator ?? null,
    totalXp: p.totalXp,
    level: lvl.level,
    coins: p.coins,
    rankTier: rankTierForLevel(lvl.level),
    currentLevelXp: lvl.currentLevelXp,
    nextLevelXp: lvl.nextLevelXp,
    levelProgressPct: lvl.levelProgressPct,
    serverRank,
    gameStats: p.gameStats,
    attributes: p.attributes,
    equipped: {
      frameId: p.equippedFrameId ?? null,
      badgeId: p.equippedBadgeId ?? null,
    },
    streakDays: p.streakDays,
    lastActiveAt: p.lastActiveAt,
    joinedAt: p.joinedAt,
  };
}

export function applyAttributeBumps(
  current: AttributesJson,
  bumps: Partial<AttributesJson>,
): AttributesJson {
  const next: AttributesJson = { ...current };
  (Object.keys(bumps) as (keyof AttributesJson)[]).forEach((k) => {
    const add = bumps[k] ?? 0;
    next[k] = Math.min(100, next[k] + add);
  });
  return next;
}
