import type { EncounterRuleset } from "../encounter.schema";
import {
  MONSTER_POWER_ADVANCED,
  MONSTER_POWER_BASIC,
  SORTED_ADVANCED_CRS,
  SORTED_BASIC_CRS,
} from "./constants";
import type { MonsterPowerResult, PartyTier } from "./types";

export function computeMonsterPower(
  crNumeric: number,
  partyTier: PartyTier,
  ruleset: EncounterRuleset
): MonsterPowerResult {
  if (ruleset === "basic") {
    return lookupBasic(crNumeric);
  }
  return lookupAdvanced(crNumeric, partyTier);
}

function lookupBasic(crNumeric: number): MonsterPowerResult {
  const exact = MONSTER_POWER_BASIC[crNumeric];
  if (exact !== undefined) {
    return { power: exact, isInterpolated: false };
  }
  return interpolate(crNumeric, SORTED_BASIC_CRS, (cr) => {
    const v = MONSTER_POWER_BASIC[cr];
    return v ?? 0;
  });
}

function lookupAdvanced(
  crNumeric: number,
  tier: PartyTier
): MonsterPowerResult {
  const exact = MONSTER_POWER_ADVANCED[crNumeric];
  if (exact !== undefined) {
    return { power: exact[tier], isInterpolated: false };
  }
  return interpolate(crNumeric, SORTED_ADVANCED_CRS, (cr) => {
    const row = MONSTER_POWER_ADVANCED[cr];
    return row ? row[tier] : 0;
  });
}

function interpolate(
  cr: number,
  knownCrs: readonly number[],
  getPower: (cr: number) => number
): MonsterPowerResult {
  if (knownCrs.length === 0) {
    return { power: 0, isInterpolated: true };
  }
  const lowest = knownCrs[0]!;
  const highest = knownCrs[knownCrs.length - 1]!;
  if (cr <= lowest) {
    return { power: getPower(lowest), isInterpolated: true };
  }
  if (cr >= highest) {
    return { power: getPower(highest), isInterpolated: true };
  }
  for (let i = 0; i < knownCrs.length - 1; i++) {
    const lo = knownCrs[i]!;
    const hi = knownCrs[i + 1]!;
    if (cr >= lo && cr <= hi) {
      const loPower = getPower(lo);
      const hiPower = getPower(hi);
      const t = (cr - lo) / (hi - lo);
      const interp = loPower + t * (hiPower - loPower);
      return { power: Math.round(interp), isInterpolated: true };
    }
  }
  return { power: getPower(highest), isInterpolated: true };
}
