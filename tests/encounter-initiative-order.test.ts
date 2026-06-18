import { describe, expect, it } from "vitest";

import type {
  Combatant,
  PartyMember,
} from "@/lib/domain/encounter/encounter.schema";
import type { InitiativeRow } from "@/page/encounters/utils/initiativeOrder";
import {
  buildInitiativeSlots,
  sortInitiative,
} from "@/page/encounters/utils/initiativeOrder";

function row(
  id: string,
  initiative: number | null,
  dexMod = 0,
  side: "ally" | "enemy" = "enemy"
): InitiativeRow {
  return { kind: "combatant", id, name: id, side, initiative, dexMod };
}

describe("sortInitiative", () => {
  it("orders descending by initiative", () => {
    const sorted = sortInitiative([row("a", 5), row("b", 15), row("c", 10)]);
    expect(sorted.map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("sends null initiatives to the bottom in stable input order", () => {
    const sorted = sortInitiative([
      row("a", null),
      row("b", 5),
      row("c", null),
      row("d", 10),
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["d", "b", "a", "c"]);
  });

  it("ties break by higher dex modifier", () => {
    const sorted = sortInitiative([
      row("a", 10, 1),
      row("b", 10, 5),
      row("c", 10, -2),
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["b", "a", "c"]);
  });

  it("ties with equal dex break deterministically by id", () => {
    const sorted = sortInitiative([
      row("zeta", 10, 2),
      row("alpha", 10, 2),
      row("middle", 10, 2),
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["alpha", "middle", "zeta"]);
  });

  it("input array is not mutated", () => {
    const input = [row("a", 1), row("b", 2)];
    const snapshot = [...input];
    sortInitiative(input);
    expect(input).toEqual(snapshot);
  });

  it("all-null input is returned unchanged", () => {
    const input = [row("a", null), row("b", null)];
    const sorted = sortInitiative(input);
    expect(sorted.map((r) => r.id)).toEqual(["a", "b"]);
  });
});

function makeCombatant(
  id: string,
  groupId?: string,
  initiative: number | null = null
): Combatant {
  return {
    id,
    monsterId: "m-goblin",
    monsterName: "Goblin",
    monsterCrNumeric: 0.25,
    side: "enemy",
    maxHp: 7,
    currentHp: 7,
    initiative,
    conditions: [],
    ...(groupId !== undefined ? { initiativeGroupId: groupId } : {}),
  };
}

function makePartyMember(
  id: string,
  initiative: number | null = null
): PartyMember {
  return {
    id,
    kind: "pc",
    name: id,
    level: 3,
    initiativeMod: 0,
    initiative,
    conditions: [],
  };
}

describe("buildInitiativeSlots", () => {
  it("groups combatants with same initiativeGroupId into a single slot", () => {
    const groupId = "group-1";
    const combatants = [
      makeCombatant("c1", groupId),
      makeCombatant("c2", groupId),
      makeCombatant("c3", groupId),
      makeCombatant("c4"), // ungrouped
    ];
    const partyMembers = [makePartyMember("pc1")];
    const dexModMap = new Map<string, number>();

    const slots = buildInitiativeSlots(combatants, partyMembers, dexModMap);
    // 1 party + 1 group + 1 ungrouped = 3 slots
    expect(slots).toHaveLength(3);
    const groupSlot = slots.find((s) => s.kind === "group");
    expect(groupSlot).toBeDefined();
    if (groupSlot?.kind === "group") {
      expect(groupSlot.combatants).toHaveLength(3);
    }
  });

  it("ungrouped combatants each become their own slot", () => {
    const combatants = [makeCombatant("c1"), makeCombatant("c2")];
    const slots = buildInitiativeSlots(combatants, [], new Map());
    expect(slots).toHaveLength(2);
    expect(slots.every((s) => s.kind === "combatant")).toBe(true);
  });

  it("slots are sorted by initiative descending", () => {
    const groupId = "group-1";
    const combatants = [
      makeCombatant("c1", groupId, 5),
      makeCombatant("c2", groupId, 5),
      makeCombatant("c3", undefined, 15),
    ];
    const partyMembers = [makePartyMember("pc1", 10)];
    const slots = buildInitiativeSlots(combatants, partyMembers, new Map());
    const initiatives = slots.map((s) => s.initiative);
    expect(initiatives).toEqual([15, 10, 5]);
  });

  it("group slot has kind 'group' with correct groupId and monsterId", () => {
    const groupId = "grp-abc";
    const combatants = [
      makeCombatant("c1", groupId),
      makeCombatant("c2", groupId),
    ];
    const slots = buildInitiativeSlots(combatants, [], new Map());
    expect(slots).toHaveLength(1);
    const slot = slots[0]!;
    expect(slot.kind).toBe("group");
    if (slot.kind === "group") {
      expect(slot.groupId).toBe(groupId);
      expect(slot.monsterId).toBe("m-goblin");
      expect(slot.combatants).toHaveLength(2);
    }
  });
});
