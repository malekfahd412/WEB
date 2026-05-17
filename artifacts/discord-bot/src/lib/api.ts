import { env } from "./env";
import { logger } from "./logger";

export type PlayerView = {
  id: number;
  username: string;
  handle: string;
  avatarUrl: string;
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  rank: string;
  serverRank: number;
  coins: number;
  discordId: string | null;
  discordUsername: string | null;
};

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function botFetch<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${env.API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "x-bot-token": env.BOT_API_TOKEN,
  };
  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    logger.warn(
      { status: res.status, path, body: text.slice(0, 200) },
      "API error",
    );
    throw new ApiError(res.status, text || res.statusText);
  }
  if (!text) {
    return undefined as unknown as T;
  }
  return JSON.parse(text) as T;
}

export const api = {
  upsertPlayer(input: {
    discordId: string;
    discordUsername: string;
    discordAvatar?: string | null;
    discordDiscriminator?: string | null;
  }) {
    return botFetch<PlayerView>("POST", "/api/admin/upsert-player", input);
  },
  getPlayerByDiscordId(discordId: string) {
    return botFetch<PlayerView>(
      "GET",
      `/api/admin/player-by-discord/${encodeURIComponent(discordId)}`,
    );
  },
  addXp(discordId: string, amount: number) {
    return botFetch<PlayerView>("POST", "/api/admin/add-xp", {
      discordId,
      amount,
    });
  },
  addCoins(discordId: string, amount: number) {
    return botFetch<PlayerView>("POST", "/api/admin/add-coins", {
      discordId,
      amount,
    });
  },
  listPlayers() {
    return botFetch<PlayerView[]>("GET", "/api/players");
  },
};

export { ApiError };
