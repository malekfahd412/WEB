import app from "./app";
import { logger } from "./lib/logger";
import { validateEnv } from "./lib/env";
import { getRedirectUri } from "./lib/discord";

try {
  validateEnv();
} catch (err) {
  logger.fatal({ err }, "Startup aborted: environment validation failed");
  process.exit(1);
}

try {
  const redirectUri = getRedirectUri();
  logger.info(
    { redirectUri, source: "DISCORD_REDIRECT_URI" },
    "Discord OAuth redirect URI resolved",
  );
} catch (err) {
  logger.warn(
    { err },
    "Discord OAuth redirect URI could not be resolved — login will fail until DISCORD_REDIRECT_URI is set",
  );
}

const port = Number(process.env["PORT"]);
const server = app.listen(port, "0.0.0.0", (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port, host: "0.0.0.0" }, "Server listening");
});

function shutdown(signal: string): void {
  logger.info({ signal }, "Shutting down");
  server.close(() => process.exit(0));
  // Hard-exit if shutdown hangs
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception — exiting");
  process.exit(1);
});
