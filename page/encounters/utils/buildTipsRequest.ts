import type { DifficultyBucket } from "@/lib/domain/encounter/cr2/types";
import type { Encounter } from "@/lib/domain/encounter/encounter.schema";
import type { Monster } from "@/lib/domain/monster.schema";
import type {
  TipsCombatantInput,
  TipsRequestPayload,
} from "@/lib/encounter-tips/types";

import { formatCr } from "./formatPower";

export type { TipsCombatantInput, TipsRequestPayload };

const MAX_KEY_TRAITS = 8;

function selectKeyTraits(monster: Monster): string[] {
  const traits: string[] = [];
  if (monster.legendaryActions && monster.legendaryActions.length > 0) {
    traits.push("legendary actions");
  }
  const hasRecharge = [
    ...(monster.actions ?? []),
    ...(monster.specialAbilities ?? []),
  ].some((a) => /recharge/i.test(a.text));
  if (hasRecharge) traits.push("recharge abilities");
  if (monster.conditionImmunities && monster.conditionImmunities.length > 0) {
    traits.push(
      `condition immunities: ${monster.conditionImmunities.join(", ")}`
    );
  }
  if (monster.spellList && monster.spellList.length > 0) {
    traits.push(`spellcaster (${monster.spellList.length} spells)`);
  }
  if (monster.damageResistances && monster.damageResistances.length > 0) {
    traits.push(`resistances: ${monster.damageResistances.join(", ")}`);
  }
  if (monster.damageImmunities && monster.damageImmunities.length > 0) {
    traits.push(`immunities: ${monster.damageImmunities.join(", ")}`);
  }
  return traits.slice(0, MAX_KEY_TRAITS);
}

/**
 * Collapses encounter enemies by monsterId and formats them for the
 * /api/encounters/tips request. Allies and PCs only contribute their levels
 * + count to the party shape; the tips prompt focuses on tactical
 * suggestions against the enemy mix.
 */
export function buildTipsRequest(
  encounter: Encounter,
  monstersById: Map<string, Monster>,
  difficulty: DifficultyBucket,
  context?: string
): TipsRequestPayload {
  const collapsed = new Map<string, { monster: Monster; count: number }>();
  for (const c of encounter.combatants) {
    if (c.side !== "enemy") continue;
    const monster = monstersById.get(c.monsterId);
    if (!monster) continue;
    const entry = collapsed.get(c.monsterId);
    if (entry) {
      entry.count += 1;
    } else {
      collapsed.set(c.monsterId, { monster, count: 1 });
    }
  }

  const combatants: TipsCombatantInput[] = [...collapsed.values()].map(
    ({ monster, count }) => ({
      monsterId: monster.id,
      name: monster.name,
      cr: formatCr(monster.crNumeric),
      size: monster.size,
      type: monster.type,
      count,
      keyTraits: selectKeyTraits(monster),
    })
  );

  return {
    party: {
      size: encounter.partyMembers.length,
      levels: encounter.partyMembers.map((p) => p.level),
    },
    difficulty,
    combatants,
    ruleset: "5e-2024",
    ...(context ? { context } : {}),
  };
}
