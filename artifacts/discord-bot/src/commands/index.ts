import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { profileCommand } from "./profile";
import { logActivityCommand } from "./log";
import { leaderboardCommand } from "./leaderboard";

export type SlashCommand = {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

export const commands: SlashCommand[] = [
  profileCommand,
  logActivityCommand,
  leaderboardCommand,
];

export const commandsByName: Map<string, SlashCommand> = new Map(
  commands.map((c) => [c.data.name, c]),
);
