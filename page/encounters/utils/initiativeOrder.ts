import type {
  Combatant,
  CombatantSide,
  PartyMember,
} from "@/lib/domain/encounter/encounter.schema";

import { dexModifier } from "./dexMod";

export type InitiativeRow = {
  kind: "combatant" | "party";
  id: string;
  name: string;
  side: CombatantSide;
  initiative: number | null;
  dexMod: number;
};

/**
 * Descending by initiative. `null` initiatives sink to the bottom in stable
 * input order. Ties resolve by higher dex modifier first, then by `id` so
 * the order is deterministic (no random tie-break — tests stay stable and
 * the current-turn pointer doesn't shift around the user).
 */
export function sortInitiative(rows: InitiativeRow[]): InitiativeRow[] {
  return [...rows].sort((a, b) => {
    if (a.initiative === null && b.initiative === null) return 0;
    if (a.initiative === null) return 1;
    if (b.initiative === null) return -1;
    if (a.initiative !== b.initiative) return b.initiative - a.initiative;
    if (a.dexMod !== b.dexMod) return b.dexMod - a.dexMod;
    return a.id.localeCompare(b.id);
  });
}

export function partyMemberToRow(p: PartyMember): InitiativeRow {
  return {
    kind: "party",
    id: p.id,
    name: p.name,
    side: "ally",
    initiative: p.initiative,
    dexMod: p.initiativeMod,
  };
}

export function combatantToRow(c: Combatant, dexMod: number): InitiativeRow {
  return {
    kind: "combatant",
    id: c.id,
    name: c.nameOverride ?? c.monsterName,
    side: c.side,
    initiative: c.initiative,
    dexMod,
  };
}

export { dexModifier };
