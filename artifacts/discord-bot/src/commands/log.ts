import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { api, ApiError } from "../lib/api";
import { logger } from "../lib/logger";
import type { SlashCommand } from "./index";

const ACTIVITY_XP: Record<string, number> = {
  gta_mission: 60,
  gta_heist: 200,
  rl_match: 40,
  rl_win: 90,
};

const ACTIVITY_LABEL: Record<string, string> = {
  gta_mission: "GTA mission",
  gta_heist: "GTA heist",
  rl_match: "Rocket League match",
  rl_win: "Rocket League win",
};

export const logActivityCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("log")
    .setDescription("Log a quick activity and earn XP.")
    .addStringOption((opt) =>
      opt
        .setName("activity")
        .setDescription("What did you just play?")
        .setRequired(true)
        .addChoices(
          { name: "GTA mission (+60 XP)", value: "gta_mission" },
          { name: "GTA heist (+200 XP)", value: "gta_heist" },
          { name: "Rocket League match (+40 XP)", value: "rl_match" },
          { name: "Rocket League win (+90 XP)", value: "rl_win" },
        ),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const activity = interaction.options.getString("activity", true);
    const xp = ACTIVITY_XP[activity];
    const label = ACTIVITY_LABEL[activity];
    if (!xp || !label) {
      await interaction.reply({ content: "Unknown activity.", ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: false });

    try {
      await api.upsertPlayer({
        discordId: interaction.user.id,
        discordUsername: interaction.user.username,
        discordAvatar: interaction.user.avatar,
        discordDiscriminator: interaction.user.discriminator,
      });
      const player = await api.addXp(interaction.user.id, xp);

      const embed = new EmbedBuilder()
        .setColor(0x4ea1ff)
        .setTitle(`+${xp} XP earned`)
        .setDescription(
          `**${interaction.user.username}** logged a **${label}**.`,
        )
        .addFields(
          { name: "Level", value: String(player.level), inline: true },
          { name: "Rank", value: player.rank, inline: true },
          { name: "Total XP", value: player.totalXp.toLocaleString(), inline: true },
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.error({ err }, "log activity failed");
      const message =
        err instanceof ApiError
          ? `API error (${err.status}). Try again later.`
          : "Could not log that activity right now.";
      await interaction.editReply({ content: message });
    }
  },
};
