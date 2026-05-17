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

describe("useEncounterLibraryStore", () => {
  beforeEach(() => {
    useEncounterLibraryStore.setState({ encounters: [] });
  });

  it("starts with empty encounters", () => {
    expect(useEncounterLibraryStore.getState().encounters).toEqual([]);
  });

  it("createEncounter defaults to 'New encounter' and advanced ruleset", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    const encounter = useEncounterLibraryStore.getState().encounters[0]!;
    expect(encounter.id).toBe(id);
    expect(encounter.name).toBe("New encounter");
    expect(encounter.ruleset).toBe("advanced");
    expect(encounter.partyMembers).toEqual([]);
    expect(encounter.combatants).toEqual([]);
    expect(encounter.schemaVersion).toBe(1);
  });

  it("createEncounter with explicit blank name is a no-op", () => {
    const id = useEncounterLibraryStore.getState().createEncounter("   ");
    expect(id).toBe("");
    expect(useEncounterLibraryStore.getState().encounters).toHaveLength(0);
  });

  it("createEncounter trims provided name", () => {
    useEncounterLibraryStore.getState().createEncounter("  Goblin ambush  ");
    expect(useEncounterLibraryStore.getState().encounters[0]!.name).toBe(
      "Goblin ambush"
    );
  });

  it("renameEncounter updates name and bumps updatedAt", async () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    const before = useEncounterLibraryStore.getState().encounters[0]!.updatedAt;
    await new Promise((r) => setTimeout(r, 2));
    useEncounterLibraryStore.getState().renameEncounter(id, "Boss fight");
    const after = useEncounterLibraryStore.getState().encounters[0]!;
    expect(after.name).toBe("Boss fight");
    expect(after.updatedAt).toBeGreaterThan(before);
  });

  it("renameEncounter with blank is a no-op", () => {
    const id = useEncounterLibraryStore.getState().createEncounter("Keep me");
    useEncounterLibraryStore.getState().renameEncounter(id, "   ");
    expect(useEncounterLibraryStore.getState().encounters[0]!.name).toBe(
      "Keep me"
    );
  });

  it("deleteEncounter removes the encounter", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    useEncounterLibraryStore.getState().deleteEncounter(id);
    expect(useEncounterLibraryStore.getState().encounters).toHaveLength(0);
  });

  it("setRuleset updates ruleset", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    useEncounterLibraryStore.getState().setRuleset(id, "basic");
    expect(useEncounterLibraryStore.getState().encounters[0]!.ruleset).toBe(
      "basic"
    );
  });

  it("addPC bounds level to [1, 20] and trims name", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    const memberId = useEncounterLibraryStore.getState().addPC(id, {
      name: "  Aragorn  ",
      level: 25,
    });
    const member = useEncounterLibraryStore
      .getState()
      .encounters[0]!.partyMembers.find((p) => p.id === memberId);
    expect(member?.name).toBe("Aragorn");
    expect(member?.level).toBe(20);

    useEncounterLibraryStore
      .getState()
      .addPC(id, { name: "Sub-zero", level: 0 });
    const sub =
      useEncounterLibraryStore.getState().encounters[0]!.partyMembers[1]!;
    expect(sub.level).toBe(1);
  });

  it("addPC with blank name returns empty string and adds no member", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    const memberId = useEncounterLibraryStore
      .getState()
      .addPC(id, { name: "  ", level: 5 });
    expect(memberId).toBe("");
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.partyMembers
    ).toHaveLength(0);
  });

  it("addCombatant with quantity 3 creates 3 distinct UUIDs with same monsterId", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    const ids = useEncounterLibraryStore.getState().addCombatant(id, {
      monster: mockMonster(),
      side: "enemy",
      quantity: 3,
    });
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);

    const combatants =
      useEncounterLibraryStore.getState().encounters[0]!.combatants;
    expect(combatants).toHaveLength(3);
    expect(combatants.every((c) => c.monsterId === "m-goblin")).toBe(true);
    expect(combatants.every((c) => c.maxHp === 7)).toBe(true);
    expect(combatants.every((c) => c.currentHp === 7)).toBe(true);
    expect(combatants.every((c) => c.side === "enemy")).toBe(true);
    expect(combatants.every((c) => c.monsterCrNumeric === 0.25)).toBe(true);
  });

  it("addCombatant default quantity is 1", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    const ids = useEncounterLibraryStore.getState().addCombatant(id, {
      monster: mockMonster(),
      side: "ally",
    });
    expect(ids).toHaveLength(1);
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.combatants[0]!.side
    ).toBe("ally");
  });

  it("addCombatant parses HP from hitPoints string", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    useEncounterLibraryStore.getState().addCombatant(id, {
      monster: mockMonster({ hitPoints: "45 (7d10 + 14)" }),
      side: "enemy",
    });
    const combatant =
      useEncounterLibraryStore.getState().encounters[0]!.combatants[0]!;
    expect(combatant.maxHp).toBe(45);
    expect(combatant.currentHp).toBe(45);
  });

  it("adjustHp clamps at [0, maxHp]", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    const [cid] = useEncounterLibraryStore
      .getState()
      .addCombatant(id, { monster: mockMonster(), side: "enemy" });
    useEncounterLibraryStore.getState().adjustHp(id, cid!, -100);
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.combatants[0]!
        .currentHp
    ).toBe(0);
    useEncounterLibraryStore.getState().adjustHp(id, cid!, +1000);
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.combatants[0]!
        .currentHp
    ).toBe(7);
  });

  it("setHp clamps and truncates", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    const [cid] = useEncounterLibraryStore
      .getState()
      .addCombatant(id, { monster: mockMonster(), side: "enemy" });
    useEncounterLibraryStore.getState().setHp(id, cid!, 5.7);
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.combatants[0]!
        .currentHp
    ).toBe(5);
  });

  it("setMaxHp clamps currentHp if newMax is smaller", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    const [cid] = useEncounterLibraryStore
      .getState()
      .addCombatant(id, { monster: mockMonster(), side: "enemy" });
    useEncounterLibraryStore.getState().setMaxHp(id, cid!, 3);
    const c = useEncounterLibraryStore.getState().encounters[0]!.combatants[0]!;
    expect(c.maxHp).toBe(3);
    expect(c.currentHp).toBe(3);
  });

  it("removeCombatant removes only the targeted instance", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    const ids = useEncounterLibraryStore.getState().addCombatant(id, {
      monster: mockMonster(),
      side: "enemy",
      quantity: 3,
    });
    useEncounterLibraryStore.getState().removeCombatant(id, ids[1]!);
    const remaining = useEncounterLibraryStore
      .getState()
      .encounters[0]!.combatants.map((c) => c.id);
    expect(remaining).toEqual([ids[0], ids[2]]);
  });

  it("updateCombatantName sets and clears nameOverride", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    const [cid] = useEncounterLibraryStore
      .getState()
      .addCombatant(id, { monster: mockMonster(), side: "enemy" });
    useEncounterLibraryStore.getState().updateCombatantName(id, cid!, " Boss ");
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.combatants[0]!
        .nameOverride
    ).toBe("Boss");
    useEncounterLibraryStore.getState().updateCombatantName(id, cid!, "");
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.combatants[0]!
        .nameOverride
    ).toBeUndefined();
  });

  it("duplicateEncounter deep-copies with new ids", () => {
    const id = useEncounterLibraryStore.getState().createEncounter("Original");
    useEncounterLibraryStore.getState().addPC(id, { name: "Pippin", level: 3 });
    useEncounterLibraryStore.getState().addCombatant(id, {
      monster: mockMonster(),
      side: "enemy",
      quantity: 2,
    });
    const newId = useEncounterLibraryStore.getState().duplicateEncounter(id);
    expect(newId).not.toBe("");
    expect(newId).not.toBe(id);
    const all = useEncounterLibraryStore.getState().encounters;
    expect(all).toHaveLength(2);
    const copy = all.find((e) => e.id === newId)!;
    expect(copy.name).toBe("Original (copy)");
    expect(copy.partyMembers[0]!.id).not.toBe(
      useEncounterLibraryStore.getState().encounters[0]!.partyMembers[0]!.id
    );
    expect(copy.combatants.map((c) => c.id)).not.toEqual(
      useEncounterLibraryStore
        .getState()
        .encounters[0]!.combatants.map((c) => c.id)
    );
  });

  it("updatePartyMember patches name and level with bounding", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    const memberId = useEncounterLibraryStore
      .getState()
      .addPC(id, { name: "Frodo", level: 1 });
    useEncounterLibraryStore.getState().updatePartyMember(id, memberId, {
      level: 50,
    });
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.partyMembers[0]!.level
    ).toBe(20);
    useEncounterLibraryStore.getState().updatePartyMember(id, memberId, {
      name: " Samwise ",
    });
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.partyMembers[0]!.name
    ).toBe("Samwise");
  });
});
