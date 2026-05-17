import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const shopItemsTable = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  rarity: text("rarity").notNull(),
  price: integer("price").notNull(),
  previewColor: text("preview_color").notNull(),
  iconKey: text("icon_key").notNull(),
});

export type ShopItem = typeof shopItemsTable.$inferSelect;
export type InsertShopItem = typeof shopItemsTable.$inferInsert;

export const inventoryTable = pgTable(
  "inventory",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id").notNull(),
    itemId: integer("item_id").notNull(),
    acquiredAt: timestamp("acquired_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("inventory_player_item_uq").on(table.playerId, table.itemId),
  ],
);

export type InventoryRow = typeof inventoryTable.$inferSelect;
export type InsertInventoryRow = typeof inventoryTable.$inferInsert;
