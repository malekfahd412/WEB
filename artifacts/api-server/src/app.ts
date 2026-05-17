import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import authRouter from "./routes/auth";
import { logger } from "./lib/logger";
import { buildSessionMiddleware } from "./lib/session";
import { apiNotFoundHandler, errorHandler } from "./middleware/errorHandler";

const app: Express = express();

// Replit serves the app via an HTTPS proxy. Trust it so secure cookies work.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(buildSessionMiddleware());

// Discord OAuth callback URL is registered without the /api prefix, so the
// auth router is also mounted at the root path to handle /auth/discord/*.
app.use("/", authRouter);
app.use("/api", router);

// Anything under /api that didn't match a route is a 404 (not a frontend page).
app.use("/api", apiNotFoundHandler);

// Global error handler — must be last.
app.use(errorHandler);

export default app;
