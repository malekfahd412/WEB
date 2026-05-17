import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, playersTable } from "@workspace/db";
import {
  GetLeaderboardParams,
  GetLeaderboardQueryParams,
  GetLeaderboardResponse,
} from "@workspace/api-zod";
import {
  getTopLeaderboard,
  leaderboardLabels,
  type LeaderboardKind,
} from "../lib/queries";

const router: IRouter = Router();

router.get("/leaderboard/:type", async (req, res): Promise<void> => {
  const params = GetLeaderboardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const query = GetLeaderboardQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const kind = params.data.type as LeaderboardKind;
  const limit = query.data.limit ?? 25;

  const [me] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.isMe, true));

  const entries = await getTopLeaderboard(kind, limit, me?.id ?? -1);
  const labels = leaderboardLabels(kind);

  res.json(
    GetLeaderboardResponse.parse({
      type: kind,
      label: labels.label,
      valueLabel: labels.valueLabel,
      entries,
    }),
  );
});

export default router;
