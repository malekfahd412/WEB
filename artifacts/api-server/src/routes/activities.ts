import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, activitiesTable, playersTable } from "@workspace/db";
import {
  ListActivityFeedQueryParams,
  ListActivityFeedResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/activities/feed", async (req, res): Promise<void> => {
  const parsed = ListActivityFeedQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const limit = parsed.data.limit ?? 20;
  const rows = await db
    .select({
      a: activitiesTable,
      p: playersTable,
    })
    .from(activitiesTable)
    .innerJoin(playersTable, eq(activitiesTable.playerId, playersTable.id))
    .orderBy(desc(activitiesTable.createdAt))
    .limit(limit);

  res.json(
    ListActivityFeedResponse.parse(
      rows.map((r) => ({
        id: r.a.id,
        playerId: r.p.id,
        playerUsername: r.p.username,
        playerAvatarUrl: r.p.avatarUrl,
        type: r.a.type,
        xpGained: r.a.xpGained,
        coinsGained: r.a.coinsGained,
        createdAt: r.a.createdAt,
      })),
    ),
  );
});

export default router;
