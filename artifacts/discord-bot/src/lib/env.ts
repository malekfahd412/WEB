function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string): string | undefined {
  const value = process.env[key];
  return value && value.length > 0 ? value : undefined;
}

export const env = {
  DISCORD_BOT_TOKEN: required("DISCORD_BOT_TOKEN"),
  DISCORD_CLIENT_ID: required("DISCORD_CLIENT_ID"),
  DISCORD_GUILD_ID: optional("DISCORD_GUILD_ID"),
  BOT_API_TOKEN: required("BOT_API_TOKEN"),
  API_BASE_URL: process.env["API_BASE_URL"] ?? "http://localhost:8080",
};
