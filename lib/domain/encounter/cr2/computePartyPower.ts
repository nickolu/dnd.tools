import type { Combatant, PartyMember } from "../encounter.schema";
import { computeMonsterPower } from "./computeMonsterPower";
import { PC_POWER_BY_LEVEL } from "./constants";
import { getPartyTier } from "./getPartyTier";

/**
 * Party Power is the sum of PC Power (table lookup by level) and the Power
 * contribution of NPC ally combatants (treated like enemy monsters for the
 * Monster Power table but added to the party side per CR 2.0).
 */
export function computePartyPower(
  partyMembers: PartyMember[],
  allies: Combatant[]
): number {
  const tier = getPartyTier(partyMembers);
  const pcPower = partyMembers.reduce(
    (sum, pc) => sum + (PC_POWER_BY_LEVEL[pc.level] ?? 0),
    0
  );
  const allyPower = allies.reduce(
    (sum, a) => sum + computeMonsterPower(a.monsterCrNumeric, tier).power,
    0
  );
  return pcPower + allyPower;
}
