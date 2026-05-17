import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { RequestHandler } from "express";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    oauthState?: string;
  }
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function buildSessionMiddleware(): RequestHandler {
  const PgStore = connectPgSimple(session);
  const secret = process.env["SESSION_SECRET"];
  if (!secret) throw new Error("SESSION_SECRET is required");
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const isProd = process.env["NODE_ENV"] === "production";

  return session({
    store: new PgStore({
      conString: databaseUrl,
      tableName: "session",
      createTableIfMissing: false,
    }),
    name: "heroes.sid",
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      maxAge: ONE_WEEK_MS,
      // The web app is served inside the Replit iframe. Cookies must be
      // SameSite=None;Secure to be sent on cross-site fetches in dev.
      sameSite: "none",
      secure: true,
      path: "/",
    },
    proxy: !isProd ? true : undefined,
  });
}
