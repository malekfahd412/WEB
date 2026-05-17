# Discord Bot (`@workspace/discord-bot`)

A standalone Node.js Discord bot for the Heroes Empire RPG system. Runs as its
own long-lived process. **Has no Vite, no bundler, and no UI dependencies** —
it talks to the system only through the API server.

## Architecture

```
Discord ──▶ Bot (this artifact) ──HTTP──▶ API Server ──▶ Postgres
                                          ▲
                                          │
                                  Frontend (Heroes Empire)
```

The bot uses the existing `/api/admin/*` routes (gated by `BOT_API_TOKEN`) to:

- Create / update a player on first interaction
- Add XP from logged activities
- Read player data and leaderboards

## Slash commands

- `/profile [user]` — Show your (or another user's) profile.
- `/log <activity>` — Log a quick activity and earn XP.
- `/leaderboard` — Top 10 players by total XP.

## Required environment

| Variable             | Where to get it                               |
| -------------------- | --------------------------------------------- |
| `DISCORD_BOT_TOKEN`  | Discord Developer Portal → Bot                |
| `DISCORD_CLIENT_ID`  | Discord Developer Portal → General Info       |
| `BOT_API_TOKEN`      | Any random string; must match the API server  |
| `DISCORD_GUILD_ID`   | _Optional._ A guild ID for instant slash command updates during development. Without it commands register globally and may take up to 1 hour to appear. |
| `API_BASE_URL`       | _Optional._ Defaults to `http://localhost:8080`. |

## Discord setup

1. Create an application at https://discord.com/developers/applications
2. Add a Bot user, copy the token → `DISCORD_BOT_TOKEN`.
3. Copy the Application ID → `DISCORD_CLIENT_ID`.
4. Invite the bot with the `applications.commands` and `bot` scopes:
   `https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot+applications.commands&permissions=2048`
