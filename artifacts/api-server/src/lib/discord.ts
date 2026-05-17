import { logger } from "./logger";

const DISCORD_AUTH = "https://discord.com/api/oauth2/authorize";
const DISCORD_TOKEN = "https://discord.com/api/oauth2/token";
const DISCORD_USER = "https://discord.com/api/users/@me";

export type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  discriminator?: string | null;
  avatar?: string | null;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/**
 * Resolve the Discord OAuth redirect URI.
 *
 * SOURCE OF TRUTH: process.env.DISCORD_REDIRECT_URI — no fallbacks, no
 * derivation, no hardcoded strings. Set this per environment:
 *   • Local:     http://localhost:3000/auth/discord/callback
 *   • Replit:    https://<replit-url>/auth/discord/callback
 *
 * The exact value MUST be registered verbatim in Discord Developer Portal
 * → OAuth2 → Redirects, otherwise Discord returns "invalid redirect_uri".
 */
export function getRedirectUri(): string {
  const value = process.env["DISCORD_REDIRECT_URI"];
  if (!value) {
    throw new Error(
      "DISCORD_REDIRECT_URI is not set. OAuth login is disabled until it is configured per environment.",
    );
  }
  return value;
}

export function buildAuthUrl(state: string): string {
  const redirectUri = getRedirectUri();
  logger.info(
    { redirectUri, step: "authorize" },
    "Building Discord OAuth authorize URL",
  );
  const params = new URLSearchParams({
    client_id: requireEnv("DISCORD_CLIENT_ID"),
    response_type: "code",
    scope: "identify",
    redirect_uri: redirectUri,
    state,
    prompt: "consent",
  });
  return `${DISCORD_AUTH}?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<{ access_token: string }> {
  const redirectUri = getRedirectUri();
  logger.info(
    { redirectUri, step: "token-exchange" },
    "Exchanging Discord OAuth code for access token",
  );
  const body = new URLSearchParams({
    client_id: requireEnv("DISCORD_CLIENT_ID"),
    client_secret: requireEnv("DISCORD_CLIENT_SECRET"),
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch(DISCORD_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord token exchange failed (${res.status}): ${text}`);
  }
  return (await res.json()) as { access_token: string };
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const res = await fetch(DISCORD_USER, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Discord user fetch failed: ${res.status}`);
  }
  return (await res.json()) as DiscordUser;
}

export function avatarUrlFor(user: DiscordUser): string {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
  }
  // Default avatar (new system uses (id >> 22) % 6)
  const idx = Number((BigInt(user.id) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}
