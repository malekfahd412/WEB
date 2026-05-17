import { pgTable, text, json, timestamp, index } from "drizzle-orm/pg-core";

// Schema mirrors the table connect-pg-simple expects.
export const sessionsTable = pgTable(
  "session",
  {
    sid: text("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire", { precision: 6, withTimezone: false }).notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);
