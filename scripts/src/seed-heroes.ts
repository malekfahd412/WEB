import {
  db,
  playersTable,
  shopItemsTable,
  inventoryTable,
  seasonsTable,
  activitiesTable,
  type InsertPlayer,
  type InsertShopItem,
  type SeasonRewardJson,
} from "@workspace/db";

async function main() {
  console.log("Clearing tables...");
  await db.delete(activitiesTable);
  await db.delete(inventoryTable);
  await db.delete(playersTable);
  await db.delete(shopItemsTable);
  await db.delete(seasonsTable);

  console.log("Seeding shop items...");
  const shopItems: InsertShopItem[] = [
    { name: "Neon Pulse Frame", description: "A pulsing cyan halo that frames your avatar.", category: "frame", rarity: "common", price: 1500, previewColor: "#22d3ee", iconKey: "frame_pulse" },
    { name: "Synthwave Frame", description: "Magenta-to-violet gradient with grid sparks.", category: "frame", rarity: "rare", price: 3200, previewColor: "#d946ef", iconKey: "frame_synth" },
    { name: "Voltage Frame", description: "Crackling lime electricity wraps your portrait.", category: "frame", rarity: "rare", price: 3500, previewColor: "#a3e635", iconKey: "frame_volt" },
    { name: "Phantom Frame", description: "Shifting holographic plates with chromatic aberration.", category: "frame", rarity: "epic", price: 6800, previewColor: "#60a5fa", iconKey: "frame_phantom" },
    { name: "Mythic Crown Frame", description: "A god-tier laurel of molten gold and plasma.", category: "frame", rarity: "mythic", price: 10000, previewColor: "#f59e0b", iconKey: "frame_crown" },

    { name: "Veteran Badge", description: "Awarded to those who keep showing up.", category: "badge", rarity: "common", price: 1200, previewColor: "#94a3b8", iconKey: "badge_vet" },
    { name: "Heist Captain", description: "For the player who plans the perfect score.", category: "badge", rarity: "rare", price: 2400, previewColor: "#f97316", iconKey: "badge_heist" },
    { name: "Goal Machine", description: "Rocket League domination, certified.", category: "badge", rarity: "rare", price: 2400, previewColor: "#38bdf8", iconKey: "badge_goal" },
    { name: "Apex Predator", description: "Top of the food chain in any lobby.", category: "badge", rarity: "epic", price: 3500, previewColor: "#ef4444", iconKey: "badge_apex" },

    { name: "XP Surge Boost", description: "+50% XP gain for the next 24 hours.", category: "boost", rarity: "common", price: 800, previewColor: "#22d3ee", iconKey: "boost_xp_24" },
    { name: "Coin Storm Boost", description: "+50% Coins gain for the next 24 hours.", category: "boost", rarity: "common", price: 800, previewColor: "#facc15", iconKey: "boost_coin_24" },
    { name: "Overdrive Boost", description: "Double XP for the next 6 hours.", category: "boost", rarity: "rare", price: 2200, previewColor: "#d946ef", iconKey: "boost_overdrive" },
  ];
  const insertedItems = await db.insert(shopItemsTable).values(shopItems).returning();

  console.log("Seeding players...");
  const players: InsertPlayer[] = [
    {
      username: "Vyx_Specter",
      handle: "specter",
      avatarUrl: "https://api.dicebear.com/9.x/bottts-neutral/png?seed=specter&backgroundColor=0f172a",
      rockstarId: "VyxSpecter-117",
      totalXp: 18450,
      coins: 4280,
      gameStats: { gtaMissions: 38, gtaHeists: 11, rlMatches: 64, rlWins: 41 },
      attributes: { unity: 62, focus: 71, strength: 58, honor: 49, passion: 67, victory: 72 },
      streakDays: 6,
      isMe: true,
    },
    {
      username: "NoxBlade",
      handle: "noxblade",
      avatarUrl: "https://api.dicebear.com/9.x/bottts-neutral/png?seed=noxblade&backgroundColor=0f172a",
      rockstarId: "NoxBlade-228",
      totalXp: 41200,
      coins: 6120,
      gameStats: { gtaMissions: 92, gtaHeists: 28, rlMatches: 110, rlWins: 71 },
      attributes: { unity: 88, focus: 92, strength: 84, honor: 78, passion: 86, victory: 95 },
      streakDays: 14,
    },
    {
      username: "RIOT.exe",
      handle: "riot_exe",
      avatarUrl: "https://api.dicebear.com/9.x/bottts-neutral/png?seed=riot&backgroundColor=0f172a",
      rockstarId: "RIOT-EXE-013",
      totalXp: 33800,
      coins: 5180,
      gameStats: { gtaMissions: 71, gtaHeists: 19, rlMatches: 88, rlWins: 53 },
      attributes: { unity: 76, focus: 81, strength: 90, honor: 64, passion: 78, victory: 82 },
      streakDays: 9,
    },
    {
      username: "PhantomGlitch",
      handle: "phantom_glitch",
      avatarUrl: "https://api.dicebear.com/9.x/bottts-neutral/png?seed=phantom&backgroundColor=0f172a",
      rockstarId: "PhantomG-941",
      totalXp: 27600,
      coins: 3920,
      gameStats: { gtaMissions: 55, gtaHeists: 14, rlMatches: 79, rlWins: 47 },
      attributes: { unity: 70, focus: 84, strength: 67, honor: 71, passion: 80, victory: 78 },
      streakDays: 3,
    },
    {
      username: "ChromeWyrm",
      handle: "chromewyrm",
      avatarUrl: "https://api.dicebear.com/9.x/bottts-neutral/png?seed=chrome&backgroundColor=0f172a",
      rockstarId: "CHRWyrm-302",
      totalXp: 21340,
      coins: 2980,
      gameStats: { gtaMissions: 47, gtaHeists: 9, rlMatches: 71, rlWins: 39 },
      attributes: { unity: 58, focus: 74, strength: 72, honor: 60, passion: 69, victory: 70 },
      streakDays: 5,
    },
    {
      username: "Kestrel.IX",
      handle: "kestrel_ix",
      avatarUrl: "https://api.dicebear.com/9.x/bottts-neutral/png?seed=kestrel&backgroundColor=0f172a",
      totalXp: 15890,
      coins: 2240,
      gameStats: { gtaMissions: 34, gtaHeists: 7, rlMatches: 58, rlWins: 33 },
      attributes: { unity: 55, focus: 68, strength: 60, honor: 52, passion: 64, victory: 66 },
      streakDays: 2,
    },
    {
      username: "DriftJackal",
      handle: "driftjackal",
      avatarUrl: "https://api.dicebear.com/9.x/bottts-neutral/png?seed=drift&backgroundColor=0f172a",
      totalXp: 12480,
      coins: 1750,
      gameStats: { gtaMissions: 26, gtaHeists: 5, rlMatches: 51, rlWins: 28 },
      attributes: { unity: 50, focus: 60, strength: 55, honor: 48, passion: 58, victory: 60 },
      streakDays: 1,
    },
    {
      username: "VoidRunner",
      handle: "voidrunner",
      avatarUrl: "https://api.dicebear.com/9.x/bottts-neutral/png?seed=void&backgroundColor=0f172a",
      totalXp: 9120,
      coins: 1280,
      gameStats: { gtaMissions: 19, gtaHeists: 3, rlMatches: 42, rlWins: 22 },
      attributes: { unity: 44, focus: 55, strength: 48, honor: 42, passion: 52, victory: 54 },
      streakDays: 4,
    },
    {
      username: "Saint_Echo",
      handle: "saint_echo",
      avatarUrl: "https://api.dicebear.com/9.x/bottts-neutral/png?seed=saint&backgroundColor=0f172a",
      totalXp: 6240,
      coins: 920,
      gameStats: { gtaMissions: 14, gtaHeists: 2, rlMatches: 35, rlWins: 17 },
      attributes: { unity: 38, focus: 50, strength: 42, honor: 40, passion: 46, victory: 48 },
      streakDays: 0,
    },
    {
      username: "Nyx0",
      handle: "nyx0",
      avatarUrl: "https://api.dicebear.com/9.x/bottts-neutral/png?seed=nyx&backgroundColor=0f172a",
      totalXp: 3120,
      coins: 540,
      gameStats: { gtaMissions: 8, gtaHeists: 1, rlMatches: 22, rlWins: 11 },
      attributes: { unity: 30, focus: 38, strength: 32, honor: 35, passion: 36, victory: 40 },
      streakDays: 0,
    },
  ];
  const insertedPlayers = await db.insert(playersTable).values(players).returning();

  // Recompute the level field from totalXp for each player.
  const PROGRESSION_MULTIPLIER = 1.35;
  const BASE = 100;
  const computeLevel = (xp: number) => {
    let level = 0, cum = 0;
    while (true) {
      const need = Math.floor(BASE * Math.pow(PROGRESSION_MULTIPLIER, level));
      if (cum + need > xp) return level;
      cum += need; level += 1;
      if (level > 999) return level;
    }
  };
  const { eq } = await import("drizzle-orm");
  for (const p of insertedPlayers) {
    const level = computeLevel(p.totalXp);
    await db.update(playersTable)
      .set({ level })
      .where(eq(playersTable.id, p.id));
  }

  console.log("Equipping starter cosmetics for me...");
  const me = insertedPlayers.find((p) => p.isMe)!;
  const starterFrame = insertedItems.find((i) => i.name === "Neon Pulse Frame")!;
  const starterBadge = insertedItems.find((i) => i.name === "Veteran Badge")!;
  await db.insert(inventoryTable).values([
    { playerId: me.id, itemId: starterFrame.id },
    { playerId: me.id, itemId: starterBadge.id },
  ]);
  await db.update(playersTable)
    .set({ equippedFrameId: starterFrame.id, equippedBadgeId: starterBadge.id })
    .where(eq(playersTable.id, me.id));

  console.log("Seeding season...");
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() - 12);
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + 32);
  const rewards: SeasonRewardJson[] = [
    { tier: 1, name: "Coin Drop", kind: "coins", amount: 500 },
    { tier: 2, name: "XP Surge", kind: "xp", amount: 250 },
    { tier: 3, name: "Neon Pulse Frame", kind: "frame", amount: 1 },
    { tier: 4, name: "Coin Stack", kind: "coins", amount: 1200 },
    { tier: 5, name: "Heist Captain Badge", kind: "badge", amount: 1 },
    { tier: 6, name: "Overdrive Boost", kind: "boost", amount: 1 },
    { tier: 7, name: "Phantom Frame", kind: "frame", amount: 1 },
    { tier: 8, name: "Mega Coin Vault", kind: "coins", amount: 4000 },
    { tier: 9, name: "Apex Predator Badge", kind: "badge", amount: 1 },
    { tier: 10, name: "Mythic Crown Frame", kind: "frame", amount: 1 },
  ];
  await db.insert(seasonsTable).values({
    name: "Season 01: Neon Reign",
    tagline: "Carve your name into the city's lights.",
    startsAt,
    endsAt,
    isActive: true,
    xpPerTier: 2500,
    rewards,
  });

  console.log("Seeding initial activities...");
  const types = ["gta_mission", "gta_heist", "rl_match", "rl_win"] as const;
  for (const p of insertedPlayers) {
    const count = 4 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const xp = type === "gta_mission" ? 150 : type === "gta_heist" ? 300 : type === "rl_match" ? 90 : 220;
      const coins = type === "gta_mission" ? 19 : type === "gta_heist" ? 38 : type === "rl_match" ? 11 : 28;
      const createdAt = new Date(Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000));
      await db.insert(activitiesTable).values({
        playerId: p.id,
        type,
        xpGained: xp,
        coinsGained: coins,
        createdAt,
      });
    }
  }

  console.log("Done seeding!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
