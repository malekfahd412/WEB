import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

export type SeasonRewardJson = {
  tier: number;
  name: string;
  kind: "coins" | "frame" | "badge" | "boost" | "xp";
  amount: number;
};

export const seasonsTable = pgTable("seasons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  xpPerTier: integer("xp_per_tier").notNull().default(2500),
  rewards: jsonb("rewards").$type<SeasonRewardJson[]>().notNull().default([]),
});

export type Season = typeof seasonsTable.$inferSelect;
export type InsertSeason = typeof seasonsTable.$inferInsert;
