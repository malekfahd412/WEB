import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export type GameStatsJson = {
  gtaMissions: number;
  gtaHeists: number;
  rlMatches: number;
  rlWins: number;
};

export type AttributesJson = {
  unity: number;
  focus: number;
  strength: number;
  honor: number;
  passion: number;
  victory: number;
};

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").unique(),
  discordUsername: text("discord_username"),
  discordAvatar: text("discord_avatar"),
  discordDiscriminator: text("discord_discriminator"),
  username: text("username").notNull(),
  handle: text("handle").notNull().unique(),
  avatarUrl: text("avatar_url").notNull(),
  rockstarId: text("rockstar_id"),
  totalXp: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(0),
  coins: integer("coins").notNull().default(0),
  gameStats: jsonb("game_stats")
    .$type<GameStatsJson>()
    .notNull()
    .default({ gtaMissions: 0, gtaHeists: 0, rlMatches: 0, rlWins: 0 }),
  attributes: jsonb("attributes")
    .$type<AttributesJson>()
    .notNull()
    .default({
      unity: 10,
      focus: 10,
      strength: 10,
      honor: 10,
      passion: 10,
      victory: 10,
    }),
  equippedFrameId: integer("equipped_frame_id"),
  equippedBadgeId: integer("equipped_badge_id"),
  streakDays: integer("streak_days").notNull().default(0),
  isMe: boolean("is_me").notNull().default(false),
  lastDailyClaimAt: timestamp("last_daily_claim_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  joinedAt: timestamp("joined_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Player = typeof playersTable.$inferSelect;
export type InsertPlayer = typeof playersTable.$inferInsert;
