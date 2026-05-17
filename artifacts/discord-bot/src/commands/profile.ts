import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { api, ApiError } from "../lib/api";
import { logger } from "../lib/logger";
import type { SlashCommand } from "./index";

const RANK_COLORS: Record<string, number> = {
  ROOKIE: 0x6b7280,
  BRONZE: 0xcd7f32,
  SILVER: 0xc0c0c0,
  GOLD: 0xffd700,
  PLATINUM: 0x00ced1,
  DIAMOND: 0x4ea1ff,
  MYTHIC: 0xff4ecd,
};

export const profileCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your Heroes Empire profile.")
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("View another player's profile")
        .setRequired(false),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser("user") ?? interaction.user;
    const isSelf = targetUser.id === interaction.user.id;
    await interaction.deferReply({ ephemeral: false });

    try {
      const player = isSelf
        ? await api.upsertPlayer({
            discordId: targetUser.id,
            discordUsername: targetUser.username,
            discordAvatar: targetUser.avatar,
            discordDiscriminator: targetUser.discriminator,
          })
        : await api.getPlayerByDiscordId(targetUser.id);

      const total = player.xpIntoLevel + player.xpToNextLevel;
      const filled = total > 0 ? Math.round((player.xpIntoLevel / total) * 12) : 0;
      const bar = "█".repeat(filled) + "░".repeat(12 - filled);

      const embed = new EmbedBuilder()
        .setColor(RANK_COLORS[player.rank] ?? 0x4ea1ff)
        .setTitle(`${player.username}`)
        .setURL(`http://localhost/players/${player.id}`)
        .setThumbnail(player.avatarUrl)
        .addFields(
          { name: "Rank", value: player.rank, inline: true },
          { name: "Level", value: String(player.level), inline: true },
          { name: "Server #", value: `#${player.serverRank}`, inline: true },
          {
            name: "XP",
            value: `${bar}\n${player.xpIntoLevel.toLocaleString()} / ${total.toLocaleString()}  (total ${player.totalXp.toLocaleString()})`,
          },
          { name: "Coins", value: `${player.coins.toLocaleString()}`, inline: true },
        )
        .setFooter({ text: `@${player.handle}` });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        await interaction.editReply({
          content: isSelf
            ? "Could not create your profile. Try again in a moment."
            : `${targetUser.username} hasn't joined Heroes Empire yet.`,
        });
        return;
      }
      logger.error({ err }, "profile command failed");
      await interaction.editReply({
        content: "Something went wrong fetching that profile.",
      });
    }
  },
};
