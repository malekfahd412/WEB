import type { Request, Response, NextFunction, RequestHandler } from "express";
import { eq } from "drizzle-orm";
import { db, playersTable, type Player as DbPlayer } from "@workspace/db";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authedPlayer?: DbPlayer;
    }
  }
}

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.id, userId))
    .limit(1);
  if (!player) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Session player not found" });
    return;
  }
  req.authedPlayer = player;
  next();
};

export function getAuthedPlayer(req: Request): DbPlayer {
  if (!req.authedPlayer) {
    throw new Error("Auth middleware did not run");
  }
  return req.authedPlayer;
}
