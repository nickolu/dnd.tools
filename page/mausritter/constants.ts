import type { HexCrawlConfig } from "./types";

export const DEFAULT_CONFIG: HexCrawlConfig = {
  hexCount: 19,
  factionCount: 3,
  adventureSiteCount: 3,
  npcsPerSettlement: 2,
  roomsPerSite: 6,
};

export const CONFIG_LIMITS = {
  hexCount: { min: 6, max: 40 },
  factionCount: { min: 2, max: 5 },
  adventureSiteCount: { min: 1, max: 10 },
  npcsPerSettlement: { min: 1, max: 5 },
  roomsPerSite: { min: 3, max: 12 },
} as const;

export const CONFIG_LABELS: Record<keyof HexCrawlConfig, string> = {
  hexCount: "Number of Hexes",
  factionCount: "Number of Factions",
  adventureSiteCount: "Adventure Sites",
  npcsPerSettlement: "NPCs per Settlement",
  roomsPerSite: "Rooms per Site",
};

export const HEX_TYPE_COLORS: Record<string, string> = {
  Countryside: "bg-green-800/40 text-green-300",
  Forest: "bg-emerald-800/40 text-emerald-300",
  River: "bg-blue-800/40 text-blue-300",
  "Human town": "bg-amber-800/40 text-amber-300",
};

export const ROOM_TYPE_COLORS: Record<string, string> = {
  Empty: "bg-zinc-700/40 text-zinc-300",
  Obstacle: "bg-orange-800/40 text-orange-300",
  Trap: "bg-red-800/40 text-red-300",
  Puzzle: "bg-purple-800/40 text-purple-300",
  Lair: "bg-yellow-800/40 text-yellow-300",
};
