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

export type InitiativeGroup = {
  kind: "group";
  groupId: string;
  monsterId: string;
  name: string;
  side: CombatantSide;
  initiative: number | null;
  dexMod: number;
  combatants: Combatant[];
};

export type InitiativeSlot = InitiativeRow | InitiativeGroup;

function slotSortId(slot: InitiativeSlot): string {
  return slot.kind === "group" ? slot.groupId : slot.id;
}

function compareSlots(a: InitiativeSlot, b: InitiativeSlot): number {
  if (a.initiative === null && b.initiative === null) return 0;
  if (a.initiative === null) return 1;
  if (b.initiative === null) return -1;
  if (a.initiative !== b.initiative) return b.initiative - a.initiative;
  if (a.dexMod !== b.dexMod) return b.dexMod - a.dexMod;
  return slotSortId(a).localeCompare(slotSortId(b));
}

/**
 * Descending by initiative. `null` initiatives sink to the bottom in stable
 * input order. Ties resolve by higher dex modifier first, then by `id` so
 * the order is deterministic (no random tie-break — tests stay stable and
 * the current-turn pointer doesn't shift around the user).
 */
export function sortInitiative(rows: InitiativeRow[]): InitiativeRow[];
export function sortInitiative(slots: InitiativeSlot[]): InitiativeSlot[];
export function sortInitiative(
  slots: InitiativeRow[] | InitiativeSlot[]
): InitiativeRow[] | InitiativeSlot[] {
  return [...slots].sort(compareSlots);
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

/**
 * Builds a sorted list of initiative slots combining party members and
 * combatants. Combatants sharing an `initiativeGroupId` are collapsed into a
 * single `InitiativeGroup` slot; ungrouped combatants become individual
 * `InitiativeRow` slots.
 */
export function buildInitiativeSlots(
  combatants: Combatant[],
  partyMembers: PartyMember[],
  dexModMap: Map<string, number>
): InitiativeSlot[] {
  const partySlots: InitiativeSlot[] = partyMembers.map(partyMemberToRow);

  const groupMap = new Map<string, Combatant[]>();
  const ungrouped: Combatant[] = [];

  for (const c of combatants) {
    if (c.initiativeGroupId) {
      const existing = groupMap.get(c.initiativeGroupId);
      if (existing) {
        existing.push(c);
      } else {
        groupMap.set(c.initiativeGroupId, [c]);
      }
    } else {
      ungrouped.push(c);
    }
  }

  const groupSlots: InitiativeSlot[] = [];
  for (const [groupId, members] of groupMap) {
    const first = members[0]!;
    const dexMod = dexModMap.get(first.id) ?? 0;
    groupSlots.push({
      kind: "group",
      groupId,
      monsterId: first.monsterId,
      name: first.nameOverride ?? first.monsterName,
      side: first.side,
      initiative: first.initiative,
      dexMod,
      combatants: members,
    });
  }

  const ungroupedSlots: InitiativeSlot[] = ungrouped.map((c) =>
    combatantToRow(c, dexModMap.get(c.id) ?? 0)
  );

  return sortInitiative([...partySlots, ...groupSlots, ...ungroupedSlots]);
}

export { dexModifier };
