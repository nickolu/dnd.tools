import { beforeEach, describe, expect, it } from "vitest";

import type { Monster } from "@/lib/domain/monster.schema";
import { useEncounterLibraryStore } from "@/lib/store/useEncounterLibraryStore";

function mockMonster(overrides: Partial<Monster> = {}): Monster {
  const base: Monster = {
    id: "m-goblin",
    name: "Goblin",
    nameNormalized: "goblin",
    challengeRating: "1/4",
    crNumeric: 0.25,
    hitPoints: "7 (2d6)",
    armorClass: "15",
    size: "Small",
    type: "humanoid",
    alignment: "neutral evil",
    source: "MM",
    speed: "30 ft.",
    abilityScores: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    schemaVersion: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    createdBy: "test",
    updatedAt: "2024-01-01T00:00:00.000Z",
    updatedBy: "test",
    isPublished: true,
  };
  return { ...base, ...overrides };
}

function seedEncounter(): {
  id: string;
  pcIds: string[];
  enemyIds: string[];
  allyIds: string[];
} {
  const id = useEncounterLibraryStore.getState().createEncounter();
  const pc1 = useEncounterLibraryStore
    .getState()
    .addPC(id, { name: "Frodo", level: 3 });
  const pc2 = useEncounterLibraryStore
    .getState()
    .addPC(id, { name: "Sam", level: 3 });
  const enemyIds = useEncounterLibraryStore
    .getState()
    .addCombatant(id, { monster: mockMonster(), side: "enemy", quantity: 2 });
  const allyIds = useEncounterLibraryStore.getState().addCombatant(id, {
    monster: mockMonster({ id: "m-imp", name: "Imp" }),
    side: "ally",
    quantity: 1,
  });
  return { id, pcIds: [pc1, pc2], enemyIds, allyIds };
}

describe("encounter store initiative actions", () => {
  beforeEach(() => {
    useEncounterLibraryStore.setState({ encounters: [], savedParty: [] });
  });

  it("setCombatantInitiative + setPartyMemberInitiative store integer values", () => {
    const { id, pcIds, enemyIds } = seedEncounter();
    useEncounterLibraryStore
      .getState()
      .setCombatantInitiative(id, enemyIds[0]!, 17.7);
    useEncounterLibraryStore
      .getState()
      .setPartyMemberInitiative(id, pcIds[0]!, 12);

    const enc = useEncounterLibraryStore.getState().encounters[0]!;
    expect(enc.combatants[0]!.initiative).toBe(17);
    expect(enc.partyMembers[0]!.initiative).toBe(12);
  });

  it("setPartyMemberInitiativeMod truncates and stores", () => {
    const { id, pcIds } = seedEncounter();
    useEncounterLibraryStore
      .getState()
      .setPartyMemberInitiativeMod(id, pcIds[0]!, 3.9);
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.partyMembers[0]!
        .initiativeMod
    ).toBe(3);
  });

  it("rollCombatantInitiatives with sideFilter only affects matching side", () => {
    const { id, enemyIds, allyIds } = seedEncounter();
    const dexMap = new Map<string, number>([
      [enemyIds[0]!, 2],
      [enemyIds[1]!, 2],
      [allyIds[0]!, 5],
    ]);
    useEncounterLibraryStore
      .getState()
      .rollCombatantInitiatives(id, dexMap, "enemy");
    const enc = useEncounterLibraryStore.getState().encounters[0]!;
    expect(
      enc.combatants.find((c) => c.id === allyIds[0])!.initiative
    ).toBeNull();
    for (const eid of enemyIds) {
      const c = enc.combatants.find((cc) => cc.id === eid)!;
      expect(c.initiative).not.toBeNull();
      expect(c.initiative!).toBeGreaterThanOrEqual(3);
      expect(c.initiative!).toBeLessThanOrEqual(22);
    }
  });

  it("rollPartyMemberInitiatives uses each member's initiativeMod", () => {
    const { id, pcIds } = seedEncounter();
    useEncounterLibraryStore
      .getState()
      .setPartyMemberInitiativeMod(id, pcIds[0]!, 5);
    useEncounterLibraryStore
      .getState()
      .setPartyMemberInitiativeMod(id, pcIds[1]!, -1);
    useEncounterLibraryStore.getState().rollPartyMemberInitiatives(id);
    const enc = useEncounterLibraryStore.getState().encounters[0]!;
    const p0 = enc.partyMembers.find((p) => p.id === pcIds[0]!)!;
    const p1 = enc.partyMembers.find((p) => p.id === pcIds[1]!)!;
    expect(p0.initiative!).toBeGreaterThanOrEqual(6);
    expect(p0.initiative!).toBeLessThanOrEqual(25);
    expect(p1.initiative!).toBeGreaterThanOrEqual(0);
    expect(p1.initiative!).toBeLessThanOrEqual(19);
  });

  it("nextTurn from null sets activeIndex 0; wraps past end increments round", () => {
    const { id } = seedEncounter();
    // total = 2 PCs + 1 enemy group (2 goblins share a slot) + 1 ally = 4
    useEncounterLibraryStore.getState().nextTurn(id);
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.initiative
    ).toEqual({ round: 1, activeIndex: 0 });

    for (let i = 0; i < 3; i++) {
      useEncounterLibraryStore.getState().nextTurn(id);
    }
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.initiative
    ).toEqual({ round: 1, activeIndex: 3 });

    // One more should wrap to 0 and bump round
    useEncounterLibraryStore.getState().nextTurn(id);
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.initiative
    ).toEqual({ round: 2, activeIndex: 0 });
  });

  it("previousTurn underflow at round 1, activeIndex 0 is a no-op", () => {
    const { id } = seedEncounter();
    useEncounterLibraryStore.getState().setActiveTurn(id, 0);
    useEncounterLibraryStore.getState().previousTurn(id);
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.initiative
    ).toEqual({ round: 1, activeIndex: 0 });
  });

  it("previousTurn at activeIndex 0 with round > 1 wraps to end and decrements round", () => {
    const { id } = seedEncounter();
    useEncounterLibraryStore.getState().setActiveTurn(id, 0);
    // Move to round 2 via nextTurn loop: total = 4 slots
    for (let i = 0; i < 4; i++) {
      useEncounterLibraryStore.getState().nextTurn(id);
    }
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.initiative.round
    ).toBe(2);
    useEncounterLibraryStore.getState().setActiveTurn(id, 0);
    useEncounterLibraryStore.getState().previousTurn(id);
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.initiative
    ).toEqual({ round: 1, activeIndex: 3 });
  });

  it("resetInitiative clears initiative on combatants AND party + resets round", () => {
    const { id, pcIds, enemyIds } = seedEncounter();
    useEncounterLibraryStore
      .getState()
      .setCombatantInitiative(id, enemyIds[0]!, 15);
    useEncounterLibraryStore
      .getState()
      .setPartyMemberInitiative(id, pcIds[0]!, 12);
    useEncounterLibraryStore.getState().nextTurn(id);
    useEncounterLibraryStore.getState().resetInitiative(id);
    const enc = useEncounterLibraryStore.getState().encounters[0]!;
    expect(enc.combatants.every((c) => c.initiative === null)).toBe(true);
    expect(enc.partyMembers.every((p) => p.initiative === null)).toBe(true);
    expect(enc.initiative).toEqual({ round: 1, activeIndex: null });
  });

  it("endEncounter resets initiative AND restores combatant HP to max", () => {
    const { id, enemyIds } = seedEncounter();
    useEncounterLibraryStore.getState().setHp(id, enemyIds[0]!, 1);
    useEncounterLibraryStore.getState().setHp(id, enemyIds[1]!, 0);
    useEncounterLibraryStore.getState().nextTurn(id);

    useEncounterLibraryStore.getState().endEncounter(id);
    const enc = useEncounterLibraryStore.getState().encounters[0]!;
    expect(enc.combatants.every((c) => c.currentHp === c.maxHp)).toBe(true);
    expect(enc.combatants.every((c) => c.initiative === null)).toBe(true);
    expect(enc.initiative).toEqual({ round: 1, activeIndex: null });
  });

  it("addCombatant with quantity > 1 assigns shared initiativeGroupId", () => {
    const { enemyIds } = seedEncounter();
    const enc = useEncounterLibraryStore.getState().encounters[0]!;
    const groupedCombatants = enc.combatants.filter((c) =>
      enemyIds.includes(c.id)
    );
    expect(groupedCombatants).toHaveLength(2);
    const groupId = groupedCombatants[0]!.initiativeGroupId;
    expect(groupId).toBeDefined();
    expect(groupedCombatants[1]!.initiativeGroupId).toBe(groupId);
  });

  it("addCombatant with quantity === 1 has no initiativeGroupId", () => {
    const { allyIds } = seedEncounter();
    const enc = useEncounterLibraryStore.getState().encounters[0]!;
    const ally = enc.combatants.find((c) => c.id === allyIds[0]);
    expect(ally?.initiativeGroupId).toBeUndefined();
  });

  it("setCombatantInitiative fans out to all group members", () => {
    const { id, enemyIds } = seedEncounter();
    useEncounterLibraryStore
      .getState()
      .setCombatantInitiative(id, enemyIds[0]!, 14);
    const enc = useEncounterLibraryStore.getState().encounters[0]!;
    for (const eid of enemyIds) {
      const c = enc.combatants.find((cc) => cc.id === eid)!;
      expect(c.initiative).toBe(14);
    }
  });

  it("rollCombatantInitiatives gives all group members same initiative", () => {
    const { id, enemyIds } = seedEncounter();
    const dexMap = new Map<string, number>([
      [enemyIds[0]!, 2],
      [enemyIds[1]!, 2],
    ]);
    useEncounterLibraryStore.getState().rollCombatantInitiatives(id, dexMap);
    const enc = useEncounterLibraryStore.getState().encounters[0]!;
    const [e0, e1] = enemyIds.map(
      (eid) => enc.combatants.find((c) => c.id === eid)!
    );
    expect(e0!.initiative).not.toBeNull();
    expect(e0!.initiative).toBe(e1!.initiative);
  });

  it("addCombatantToGroup adds a new combatant with same initiativeGroupId", () => {
    const { id, enemyIds } = seedEncounter();
    const enc0 = useEncounterLibraryStore.getState().encounters[0]!;
    const groupId = enc0.combatants.find(
      (c) => c.id === enemyIds[0]
    )?.initiativeGroupId;
    expect(groupId).toBeDefined();
    useEncounterLibraryStore.getState().addCombatantToGroup(id, groupId!);
    const enc1 = useEncounterLibraryStore.getState().encounters[0]!;
    const groupMembers = enc1.combatants.filter(
      (c) => c.initiativeGroupId === groupId
    );
    expect(groupMembers).toHaveLength(3);
  });

  it("duplicateCombatant strips initiativeGroupId from the copy", () => {
    const { id, enemyIds } = seedEncounter();
    useEncounterLibraryStore.getState().duplicateCombatant(id, enemyIds[0]!);
    const enc = useEncounterLibraryStore.getState().encounters[0]!;
    // Original enemy group still has 2 members
    const enc0GroupId = enc.combatants.find(
      (c) => c.id === enemyIds[0]
    )?.initiativeGroupId;
    const groupMembers = enc.combatants.filter(
      (c) => c.initiativeGroupId === enc0GroupId
    );
    expect(groupMembers).toHaveLength(2);
    // The newest combatant (the duplicate) should have no initiativeGroupId
    const newest = enc.combatants[enc.combatants.length - 1]!;
    expect(newest.id).not.toBe(enemyIds[0]);
    expect(newest.id).not.toBe(enemyIds[1]);
    expect(newest.initiativeGroupId).toBeUndefined();
  });

  it("countInitiativeSlots: grouped combatants count as 1 slot", () => {
    const encounterId = useEncounterLibraryStore.getState().createEncounter();
    // Add 4 goblins (1 group = 1 slot) + 2 PCs + 1 solo ally
    useEncounterLibraryStore
      .getState()
      .addPC(encounterId, { name: "A", level: 1 });
    useEncounterLibraryStore
      .getState()
      .addPC(encounterId, { name: "B", level: 1 });
    useEncounterLibraryStore.getState().addCombatant(encounterId, {
      monster: mockMonster(),
      side: "enemy",
      quantity: 4,
    });
    useEncounterLibraryStore.getState().addCombatant(encounterId, {
      monster: mockMonster({ id: "m-imp", name: "Imp" }),
      side: "ally",
      quantity: 1,
    });
    // 2 PCs + 1 enemy group + 1 ally = 4 slots
    // 4 nextTurn calls from null reach index 3, then 1 more wraps to round 2
    for (let i = 0; i < 5; i++) {
      useEncounterLibraryStore.getState().nextTurn(encounterId);
    }
    expect(
      useEncounterLibraryStore
        .getState()
        .encounters.find((e) => e.id === encounterId)!.initiative
    ).toEqual({ round: 2, activeIndex: 0 });
  });
});
