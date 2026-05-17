"use client";

import { useMemo } from "react";

import type { Combatant } from "@/lib/domain/encounter/encounter.schema";
import { useMonsters } from "@/lib/query/hooks/useMonsters";
import { dexModifier } from "@/page/encounters/utils/dexMod";

/**
 * Build a Map<combatantId, dexMod> from the monster catalog. Combatants
 * whose monster is no longer in the catalog default to dex mod 0.
 */
export function useDexModByCombatantId(
  combatants: Combatant[]
): Map<string, number> {
  const { data: monsters = [] } = useMonsters();
  return useMemo(() => {
    const dexByMonsterId = new Map<string, number>();
    for (const m of monsters) {
      dexByMonsterId.set(m.id, dexModifier(m.abilityScores.dex));
    }
    const result = new Map<string, number>();
    for (const c of combatants) {
      result.set(c.id, dexByMonsterId.get(c.monsterId) ?? 0);
    }
    return result;
  }, [combatants, monsters]);
}
