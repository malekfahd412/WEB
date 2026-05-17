import {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  type Interaction,
} from "discord.js";
import { env } from "./lib/env";
import { logger } from "./lib/logger";
import { commands, commandsByName } from "./commands";

async function registerCommands(): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(env.DISCORD_BOT_TOKEN);
  const body = commands.map((c) => c.data.toJSON());

  if (env.DISCORD_GUILD_ID) {
    await rest.put(
      Routes.applicationGuildCommands(
        env.DISCORD_CLIENT_ID,
        env.DISCORD_GUILD_ID,
      ),
      { body },
    );
    logger.info(
      { count: body.length, guildId: env.DISCORD_GUILD_ID },
      "Registered guild slash commands",
    );
  } else {
    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body });
    logger.info(
      { count: body.length },
      "Registered global slash commands (may take up to 1 hour to appear)",
    );
  }
}

async function main(): Promise<void> {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  function shutdown(signal: string): void {
    logger.info({ signal }, "Shutting down Discord bot");
    client.destroy().catch(() => {});
    setTimeout(() => process.exit(0), 1000).unref();
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

  client.once(Events.ClientReady, (c) => {
    logger.info({ tag: c.user.tag }, "Discord bot online");
  });

  client.on(Events.Error, (err) => {
    logger.error({ err }, "Discord client error");
  });

  client.on(Events.Warn, (msg) => {
    logger.warn({ msg }, "Discord client warning");
  });

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const handler = commandsByName.get(interaction.commandName);
    if (!handler) {
      logger.warn(
        { command: interaction.commandName },
        "Received unknown command",
      );
      return;
    }
    try {
      await handler.execute(interaction);
    } catch (err) {
      logger.error(
        { err, command: interaction.commandName },
        "Command handler threw",
      );
      const reply = {
        content: "Something went wrong handling that command.",
        ephemeral: true,
      };
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  });

  await registerCommands();
  await client.login(env.DISCORD_BOT_TOKEN);
}

main().catch((err) => {
  logger.error({ err }, "Bot failed to start");
  process.exit(1);
});
