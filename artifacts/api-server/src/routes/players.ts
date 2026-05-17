import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, playersTable } from "@workspace/db";
import {
  ListPlayersResponse,
  GetPlayerParams,
  GetPlayerResponse,
} from "@workspace/api-zod";
import { toPlayerView } from "../lib/progression";

const router: IRouter = Router();

router.get("/players", async (_req, res): Promise<void> => {
  const all = await db
    .select()
    .from(playersTable)
    .orderBy(desc(playersTable.totalXp));
  const views = all.map((p, idx) => toPlayerView(p, idx + 1));
  res.json(ListPlayersResponse.parse(views));
});

router.get("/players/:id", async (req, res): Promise<void> => {
  const parsed = GetPlayerParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.id, parsed.data.id));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  const all = await db
    .select({ id: playersTable.id, totalXp: playersTable.totalXp })
    .from(playersTable)
    .orderBy(desc(playersTable.totalXp));
  const rank = all.findIndex((p) => p.id === player.id) + 1;
  res.json(GetPlayerResponse.parse(toPlayerView(player, rank)));
});

export default router;
