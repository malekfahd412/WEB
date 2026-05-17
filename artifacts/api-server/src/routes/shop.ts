import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import {
  db,
  playersTable,
  shopItemsTable,
  inventoryTable,
} from "@workspace/db";
import {
  ListShopItemsQueryParams,
  ListShopItemsResponse,
  PurchaseItemBody,
  PurchaseItemResponse,
} from "@workspace/api-zod";
import { toPlayerView } from "../lib/progression";
import { getServerRankFor } from "../lib/queries";

const router: IRouter = Router();

router.get("/shop", async (req, res): Promise<void> => {
  const parsed = ListShopItemsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const items = await db.select().from(shopItemsTable);
  const filtered = parsed.data.category
    ? items.filter((i) => i.category === parsed.data.category)
    : items;
  filtered.sort((a, b) => a.price - b.price);
  res.json(ListShopItemsResponse.parse(filtered));
});

router.post("/shop/purchase", async (req, res): Promise<void> => {
  const parsed = PurchaseItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [me] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.isMe, true));
  if (!me) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
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
    .where(
      and(
        eq(inventoryTable.playerId, me.id),
        eq(inventoryTable.itemId, item.id),
      ),
    );
  if (owned) {
    res.status(400).json({ error: "Already owned" });
    return;
  }
  if (me.coins < item.price) {
    res.status(400).json({ error: "Insufficient coins" });
    return;
  }

  const [updated] = await db
    .update(playersTable)
    .set({ coins: me.coins - item.price })
    .where(eq(playersTable.id, me.id))
    .returning();

  await db.insert(inventoryTable).values({
    playerId: me.id,
    itemId: item.id,
  });

  const rank = await getServerRankFor(updated.id);
  res.json(
    PurchaseItemResponse.parse({
      player: toPlayerView(updated, rank),
      item,
    }),
  );
});

export default router;
