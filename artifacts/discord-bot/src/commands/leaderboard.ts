import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { api } from "../lib/api";
import { logger } from "../lib/logger";
import type { SlashCommand } from "./index";

const MEDALS = ["🥇", "🥈", "🥉"];

export const leaderboardCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show the top players by total XP.") as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: false });

    try {
      const players = await api.listPlayers();
      const top = players.slice(0, 10);
      if (top.length === 0) {
        await interaction.editReply({ content: "No players yet. Be the first!" });
        return;
      }

      const lines = top.map((p, i) => {
        const prefix = MEDALS[i] ?? `\`#${String(i + 1).padStart(2, " ")}\``;
        return `${prefix}  **${p.username}** — Lv ${p.level} · ${p.rank} · ${p.totalXp.toLocaleString()} XP`;
      });

      const embed = new EmbedBuilder()
        .setColor(0xff4ecd)
        .setTitle("Heroes Empire — Top 10")
        .setDescription(lines.join("\n"))
        .setFooter({ text: `${players.length} players total` });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      logger.error({ err }, "leaderboard failed");
      await interaction.editReply({
        content: "Could not load the leaderboard.",
      });
    }
  },
};
