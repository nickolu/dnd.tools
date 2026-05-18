import type { DifficultyBucket, PartyTier } from "./types";

export const PC_POWER_BY_LEVEL: Record<number, number> = {
  1: 11,
  2: 14,
  3: 18,
  4: 23,
  5: 32,
  6: 35,
  7: 41,
  8: 44,
  9: 49,
  10: 53,
  11: 62,
  12: 68,
  13: 71,
  14: 74,
  15: 82,
  16: 84,
  17: 103,
  18: 119,
  19: 131,
  20: 141,
};

export const DIFFICULTY_BUCKETS_ADVANCED: readonly DifficultyBucket[] = [
  "Mild",
  "Bruising",
  "Bloody",
  "Brutal",
  "Oppressive",
  "Overwhelming",
  "Crushing",
  "Devastating",
  "Impossible",
];

export const DIFFICULTY_MULTIPLIERS_ADVANCED: Record<DifficultyBucket, number> =
  {
    Mild: 0.4,
    Bruising: 0.6,
    Bloody: 0.75,
    Brutal: 0.9,
    Oppressive: 1.0,
    Overwhelming: 1.1,
    Crushing: 1.3,
    Devastating: 1.6,
    Impossible: 2.25,
  };

/**
 * CR 2.0 Advanced — Monster Power per CR per party tier (1-4).
 *
 * Sparse: rows missing from this map are linearly interpolated from adjacent
 * known rows per tier; results are flagged `isInterpolated: true`.
 *
 * Rows still missing from the GMBinder source:
 *   0.25, 2, 3, 4, 6, 8, 15, 20, 25, 30
 *
 * Fill these in from https://www.gmbinder.com/share/-N4m46K77hpMVnh7upYa.
 * Callers do not need to change — they look up exact rows first, then fall
 * back to interpolation.
 */
export const MONSTER_POWER_ADVANCED: Record<
  number,
  Record<PartyTier, number>
> = {
  0: { 1: 1, 2: 1, 3: 0, 4: 0 },
  0.125: { 1: 4, 2: 3, 3: 3, 4: 2 },
  0.5: { 1: 16, 2: 12, 3: 7, 4: 5 },
  1: { 1: 22, 2: 17, 3: 15, 4: 8 },
  5: { 1: 70, 2: 60, 3: 45, 4: 40 },
  10: { 1: 115, 2: 95, 3: 75, 4: 60 },
};

export const SORTED_ADVANCED_CRS: readonly number[] = Object.keys(
  MONSTER_POWER_ADVANCED
)
  .map(Number)
  .sort((a, b) => a - b);
