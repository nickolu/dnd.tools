export type DifficultyBucket =
  | "Mild"
  | "Bruising"
  | "Bloody"
  | "Brutal"
  | "Oppressive"
  | "Overwhelming"
  | "Crushing"
  | "Devastating"
  | "Impossible";

export type PartyTier = 1 | 2 | 3 | 4;

export type MonsterPowerResult = {
  power: number;
  isInterpolated: boolean;
};

export type DifficultyClassification = {
  bucket: DifficultyBucket;
  between: readonly [DifficultyBucket, DifficultyBucket] | null;
};

export type BalanceResult = {
  partyPower: number;
  encounterPower: number;
  tier: PartyTier;
  classification: DifficultyClassification;
  hasInterpolatedEnemy: boolean;
};
