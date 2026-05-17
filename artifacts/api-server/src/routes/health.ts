import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

// Cheap liveness probe — does the process respond?
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Deeper readiness probe — can we actually talk to the database?
router.get("/readyz", async (req, res): Promise<void> => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: "ok", database: "ok" });
  } catch (err) {
    req.log?.error?.({ err }, "readiness check failed: database unreachable");
    res.status(503).json({ status: "degraded", database: "unreachable" });
  }
});

export default router;
