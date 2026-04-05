export type HexCrawlConfig = {
  hexCount: number;
  factionCount: number;
  adventureSiteCount: number;
  npcsPerSettlement: number;
  roomsPerSite: number;
};

export type GeneratedHex = {
  id: string;
  index: number;
  hexType: string;
  landmark: string;
  landmarkDetail: string;
  settlement: GeneratedSettlement | null;
  adventureSite: GeneratedAdventureSite | null;
};

export type GeneratedSettlement = {
  id: string;
  name: string;
  size: string;
  governance: string;
  detail: string;
  industries: string[];
  event: string;
  tavern: GeneratedTavern | null;
  npcs: GeneratedNpc[];
};

export type GeneratedTavern = {
  name: string;
  specialtyMeal: string;
};

export type GeneratedFaction = {
  id: string;
  name: string;
  resources: string[];
  goals: { description: string; difficulty: number }[];
};

export type GeneratedAdventureSite = {
  id: string;
  construction: string;
  inhabitants: string;
  ruination: string;
  searchingFor: string;
  secret: string;
  rooms: GeneratedRoom[];
};

export type GeneratedRoom = {
  id: string;
  roomNumber: number;
  roomType: string;
  hasCreature: boolean;
  hasTreasure: boolean;
  feature: string;
  treasure: GeneratedTreasure | null;
};

export type GeneratedTreasure = {
  type: string;
  detail: string;
  magicSword: GeneratedMagicSword | null;
};

export type GeneratedMagicSword = {
  weaponClass: string;
  name: string;
  trigger: string;
  effect: string;
  isCursed: boolean;
  curse: string | null;
  curseLiftedBy: string | null;
};

export type GeneratedNpc = {
  id: string;
  name: string;
  socialPosition: string;
  paymentForService: string;
  birthsign: string;
  disposition: string;
  appearance: string;
  quirk: string;
  wants: string;
  relationship: string;
};

export type HexCrawlState = {
  config: HexCrawlConfig;
  hexes: GeneratedHex[];
  factions: GeneratedFaction[];
  generatedAt: number | null;
};
