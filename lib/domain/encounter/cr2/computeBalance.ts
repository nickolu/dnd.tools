import type { Encounter } from "../encounter.schema";
import { classifyDifficulty } from "./classifyDifficulty";
import { computeMonsterPower } from "./computeMonsterPower";
import { computePartyPower } from "./computePartyPower";
import { getPartyTier } from "./getPartyTier";
import type { BalanceResult } from "./types";

export function computeBalance(encounter: Encounter): BalanceResult {
  const allies = encounter.combatants.filter((c) => c.side === "ally");
  const enemies = encounter.combatants.filter((c) => c.side === "enemy");

  const tier = getPartyTier(encounter.partyMembers);
  const partyPower = computePartyPower(
    encounter.partyMembers,
    allies,
    encounter.ruleset
  );

  let encounterPower = 0;
  let hasInterpolatedEnemy = false;
  for (const enemy of enemies) {
    const { power, isInterpolated } = computeMonsterPower(
      enemy.monsterCrNumeric,
      tier,
      encounter.ruleset
    );
    encounterPower += power;
    if (isInterpolated) hasInterpolatedEnemy = true;
  }

  const classification = classifyDifficulty(
    partyPower,
    encounterPower,
    encounter.ruleset
  );

  return {
    partyPower,
    encounterPower,
    tier,
    classification,
    hasInterpolatedEnemy,
  };
}
