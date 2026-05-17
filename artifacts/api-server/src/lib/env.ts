import { logger } from "./logger";

type EnvSpec = {
  required: readonly string[];
  optional: readonly string[];
};

const SPEC: EnvSpec = {
  required: [
    "DATABASE_URL",
    "SESSION_SECRET",
    "PORT",
    "DISCORD_CLIENT_ID",
    "DISCORD_CLIENT_SECRET",
  ],
  optional: [
    "BOT_API_TOKEN",
    // Explicit per-environment redirect override. If unset, the server derives
    // it from REPLIT_DEV_DOMAIN. Set this to keep local + prod cleanly
    // separated (e.g. http://localhost:3000/auth/discord/callback locally).
    "DISCORD_REDIRECT_URI",
    "REPLIT_DEV_DOMAIN",
    "REPLIT_DOMAINS",
    "NODE_ENV",
  ],
};

export function validateEnv(): void {
  const missing = SPEC.required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.fatal(
      { missing },
      "Required environment variables are missing — server cannot start",
    );
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  const missingOptional = SPEC.optional.filter((k) => !process.env[k]);
  if (missingOptional.length > 0) {
    logger.warn(
      { missing: missingOptional },
      "Optional environment variables are not set — related features will be disabled",
    );
  }

  const port = Number(process.env["PORT"]);
  if (Number.isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
  }
}
