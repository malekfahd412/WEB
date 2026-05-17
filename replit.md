# Heroes Empire

A cyberpunk-styled web app for tracking competitive gaming activity (GTA Online + Rocket League). Players level up through 7 rank tiers, climb leaderboards, earn coins, buy cosmetics, and progress through seasons.

## Architecture

- Monorepo (pnpm workspaces) with path-based routing.
- Web frontend: `artifacts/heroes-empire` — React + Vite + Tailwind + shadcn-style components, framer-motion, wouter, TanStack Query. Cyberpunk dark theme defined in `src/index.css`.
- API backend: `artifacts/api-server` — Express 5 with route handlers in `src/routes/`. Domain logic in `src/lib/progression.ts` (XP curve `100 * 1.35^level`, rank tiers ROOKIE/BRONZE/SILVER/GOLD/PLATINUM/DIAMOND/MYTHIC, activity rewards) and `src/lib/queries.ts` (leaderboards, server totals, season progress).
- Shared OpenAPI spec: `lib/api-spec/openapi.yaml`. Codegen produces:
  - `lib/api-client-react` — typed React Query hooks (`useGetMe`, `useLogActivity`, `usePurchaseItem`, etc.).
  - `lib/api-zod` — Zod schemas used by the server to validate request/response payloads.
- Database: Postgres via Drizzle ORM (`lib/db`). Schemas: `players`, `activities`, `shop_items`, `inventory`, `seasons`.

## Authentication (Discord OAuth2)

- Login uses Discord OAuth2 (`identify` scope only).
- Server: `artifacts/api-server/src/routes/auth.ts` exposes `GET /api/auth/discord`, `GET /api/auth/discord/callback`, `GET /api/auth/me`, `POST /api/auth/logout`.
- Sessions stored in Postgres table `session` via `connect-pg-simple` (configured in `src/lib/session.ts`). Cookie name `heroes.sid`, `httpOnly`, `secure`, `sameSite=none` (required because the app loads inside the Replit iframe).
- All `/api/me/*` routes are gated by `requireAuth` middleware which loads `req.authedPlayer` from `req.session.userId`.
- On first login, a new row is inserted in `players` with `discord_id`, `discord_username`, `discord_avatar`, `discord_discriminator`, `last_login_at`. The seeded "Vyx_Specter" row remains as a leaderboard filler.
- Frontend: `pages/login.tsx` shows the Discord button; `components/auth/AuthGate.tsx` redirects to `/login` on `authenticated=false`. `Shell.tsx` has a Logout button that calls `/api/auth/logout` and resets the React Query cache.
- Required Discord application redirect URI:
  `https://${REPLIT_DEV_DOMAIN}/api/auth/discord/callback`

## Bot/admin endpoints

All `/api/admin/*` routes require header `X-Bot-Token` matching env var `BOT_API_TOKEN`. Returns 503 if the token is not configured.

- `POST /api/admin/upsert-player` — body `{ discordId, discordUsername, discordAvatar?, discordDiscriminator? }`. Creates a new player on first interaction or updates Discord metadata for an existing one. Returns the player view.
- `GET  /api/admin/player-by-discord/:discordId` — fetch a player view by Discord ID.
- `POST /api/admin/add-xp` / `add-coins` / `set-rockstar-id` — body `{ discordId, amount | rockstarId }`.

## Discord bot (`artifacts/discord-bot`)

A standalone Node.js (discord.js v14) process. Runs in its own workflow, does NOT depend on Vite or any frontend tooling, and only talks to the rest of the system through the API server using the bot endpoints above.

- Entry: `src/index.ts` — connects with `GatewayIntentBits.Guilds`, registers slash commands (guild-scoped if `DISCORD_GUILD_ID` is set, otherwise global), routes `InteractionCreate` events to handlers in `src/commands/`.
- Slash commands: `/profile [user]`, `/log <activity>`, `/leaderboard`.
- API client: `src/lib/api.ts` — thin `fetch` wrapper that always sends `X-Bot-Token: BOT_API_TOKEN` to `API_BASE_URL` (defaults to `http://localhost:8080`).
- Required secrets: `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`, `BOT_API_TOKEN`. Optional: `DISCORD_GUILD_ID` (instant slash command updates during dev).
- Dev script uses `tsx watch` — no build step.

## Pages

- `/` — Dashboard with profile HUD, quick activity log buttons, personal log, top players, server stats, season progress.
- `/profile` — Full self profile, attributes, game stats, Rockstar ID linking, daily reward claim, activity history.
- `/players/:id` — Read-only public profile of any player.
- `/leaderboards` — Tabbed (XP / GTA Missions / GTA Heists / RL Matches / RL Wins) with podium for top 3 and ranked list.
- `/shop` — Filterable shop (Frames / Badges / Boosts) with rarity glow, purchase flow with celebratory overlay.
- `/inventory` — Owned items grouped by category, equip controls for frames and badges.
- `/season` — Current season banner, XP progress, tier-by-tier reward track.

## Common commands

- `pnpm run typecheck` — typecheck all packages.
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks + Zod schemas after editing `openapi.yaml`.
- `pnpm --filter @workspace/db run push` — push schema changes to Postgres.
- `pnpm --filter @workspace/scripts run seed:heroes` — wipe and reseed players, shop, season.
