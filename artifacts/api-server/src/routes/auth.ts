import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, playersTable } from "@workspace/db";
import {
  buildAuthUrl,
  exchangeCode,
  fetchDiscordUser,
  avatarUrlFor,
  getRedirectUri,
} from "../lib/discord";
import { GetAuthSessionResponse, LogoutResponse } from "@workspace/api-zod";
import { toPlayerView } from "../lib/progression";
import { getServerRankFor } from "../lib/queries";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function loginUrl(): string {
  return "/api/auth/discord";
}

function postLoginRedirect(): string {
  // Redirect back to the web app root after auth
  return "/";
}

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.json(
      GetAuthSessionResponse.parse({
        authenticated: false,
        loginUrl: loginUrl(),
      }),
    );
    return;
  }
  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.id, userId))
    .limit(1);
  if (!player) {
    req.session.destroy(() => {});
    res.json(
      GetAuthSessionResponse.parse({
        authenticated: false,
        loginUrl: loginUrl(),
      }),
    );
    return;
  }
  const rank = await getServerRankFor(player.id);
  res.json(
    GetAuthSessionResponse.parse({
      authenticated: true,
      loginUrl: loginUrl(),
      player: toPlayerView(player, rank),
    }),
  );
});

router.get("/auth/discord", (req, res): void => {
  const state = crypto.randomBytes(16).toString("hex");
  req.session.oauthState = state;
  req.session.save((err) => {
    if (err) {
      logger.error({ err }, "Failed to save OAuth state");
      res.status(500).send("Session error");
      return;
    }
    res.redirect(buildAuthUrl(state));
  });
});

router.get("/auth/discord/callback", async (req, res): Promise<void> => {
  try {
    const code = typeof req.query["code"] === "string" ? req.query["code"] : null;
    const state = typeof req.query["state"] === "string" ? req.query["state"] : null;
    const expected = req.session?.oauthState;
    if (!code) {
      res.status(400).send("Missing code");
      return;
    }
    if (!state || !expected || state !== expected) {
      logger.warn({ state, expected }, "OAuth state mismatch");
      res.status(400).send("Invalid state");
      return;
    }
    delete req.session.oauthState;

    const token = await exchangeCode(code);
    const dUser = await fetchDiscordUser(token.access_token);

    const displayName = dUser.global_name ?? dUser.username;
    const handle = `@${dUser.username}`;
    const avatar = avatarUrlFor(dUser);
    const now = new Date();

    // Upsert by discordId
    const [existing] = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.discordId, dUser.id))
      .limit(1);

    let playerId: number;
    if (existing) {
      const [updated] = await db
        .update(playersTable)
        .set({
          discordUsername: dUser.username,
          discordAvatar: dUser.avatar ?? null,
          discordDiscriminator: dUser.discriminator ?? null,
          username: displayName,
          avatarUrl: avatar,
          lastLoginAt: now,
          lastActiveAt: now,
        })
        .where(eq(playersTable.id, existing.id))
        .returning();
      playerId = updated.id;
    } else {
      // Ensure unique handle if it already exists
      let finalHandle = handle;
      let suffix = 1;
      while (true) {
        const [clash] = await db
          .select({ id: playersTable.id })
          .from(playersTable)
          .where(eq(playersTable.handle, finalHandle))
          .limit(1);
        if (!clash) break;
        suffix += 1;
        finalHandle = `${handle}${suffix}`;
      }

      const [created] = await db
        .insert(playersTable)
        .values({
          discordId: dUser.id,
          discordUsername: dUser.username,
          discordAvatar: dUser.avatar ?? null,
          discordDiscriminator: dUser.discriminator ?? null,
          username: displayName,
          handle: finalHandle,
          avatarUrl: avatar,
          lastLoginAt: now,
          lastActiveAt: now,
        })
        .returning();
      playerId = created.id;
    }

    req.session.userId = playerId;
    req.session.save((err) => {
      if (err) {
        logger.error({ err }, "Failed to save session after login");
        res.status(500).send("Session error");
        return;
      }
      res.redirect(postLoginRedirect());
    });
  } catch (err) {
    logger.error({ err }, "Discord OAuth callback failed");
    res.status(500).send("Login failed. Check server logs.");
  }
});

router.get("/auth/discord/diagnostics", (_req, res): void => {
  const clientIdSet = Boolean(process.env["DISCORD_CLIENT_ID"]);
  const clientSecretSet = Boolean(process.env["DISCORD_CLIENT_SECRET"]);
  const redirectUriEnv = process.env["DISCORD_REDIRECT_URI"] ?? null;

  let resolvedRedirectUri: string | null = null;
  let resolverError: string | null = null;
  try {
    resolvedRedirectUri = getRedirectUri();
  } catch (err) {
    resolverError = err instanceof Error ? err.message : String(err);
  }

  res.json({
    env: {
      DISCORD_CLIENT_ID: clientIdSet ? "set" : "missing",
      DISCORD_CLIENT_SECRET: clientSecretSet ? "set" : "missing",
      DISCORD_REDIRECT_URI: redirectUriEnv ? "set" : "missing",
    },
    redirectUri: resolvedRedirectUri,
    resolverError,
    authorizeUrlHost: "https://discord.com/api/oauth2/authorize",
    note:
      "The 'redirectUri' value must be registered verbatim in Discord Developer Portal → OAuth2 → Redirects.",
  });
});

router.post("/auth/logout", (req, res): void => {
  if (!req.session) {
    res.json(LogoutResponse.parse({ ok: true }));
    return;
  }
  req.session.destroy((err) => {
    if (err) {
      logger.error({ err }, "Failed to destroy session");
      res.status(500).json({ error: "Failed to logout" });
      return;
    }
    res.clearCookie("heroes.sid", { path: "/" });
    res.json(LogoutResponse.parse({ ok: true }));
  });
});

export default router;
