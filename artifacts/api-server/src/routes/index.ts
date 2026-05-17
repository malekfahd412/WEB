import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import meRouter from "./me";
import playersRouter from "./players";
import shopRouter from "./shop";
import leaderboardRouter from "./leaderboard";
import seasonRouter from "./season";
import activitiesRouter from "./activities";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(meRouter);
router.use(playersRouter);
router.use(shopRouter);
router.use(leaderboardRouter);
router.use(seasonRouter);
router.use(activitiesRouter);
router.use(adminRouter);

export default router;
