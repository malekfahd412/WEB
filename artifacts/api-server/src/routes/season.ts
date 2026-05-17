import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, playersTable } from "@workspace/db";
import { GetCurrentSeasonResponse } from "@workspace/api-zod";
import { getCurrentSeasonProgress } from "../lib/queries";

const router: IRouter = Router();

router.get("/season/current", async (_req, res): Promise<void> => {
  const [me] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.isMe, true));
  if (!me) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  const season = await getCurrentSeasonProgress(me);
  res.json(GetCurrentSeasonResponse.parse(season));
});

export default router;
