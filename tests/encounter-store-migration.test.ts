import { beforeEach, describe, expect, it } from "vitest";

import {
  migrateEncounterLibrary,
  useEncounterLibraryStore,
} from "@/lib/store/useEncounterLibraryStore";

// Frozen v1-shape snapshot. v1 records lack Slice 2 fields
// (initiative, tips, tipsGeneratedAt, initiativeMod) — migration should
// fill them in with defaults rather than dropping the record.
const V1_ENCOUNTER = {
  id: "enc-old",
  name: "Old Encounter",
  ruleset: "basic",
  partyMembers: [
    {
      id: "pc-1",
      kind: "pc",
      name: "Frodo",
      level: 3,
    },
  ],
  combatants: [
    {
      id: "c-1",
      monsterId: "m-goblin",
      monsterName: "Goblin",
      monsterCrNumeric: 0.25,
      side: "enemy",
      maxHp: 7,
      currentHp: 5,
    },
  ],
  createdAt: 1000,
  updatedAt: 2000,
  schemaVersion: 1,
};

describe("migrateEncounterLibrary (v1 → v2)", () => {
  it("backfills initiative + tips on the encounter", () => {
    const migrated = migrateEncounterLibrary({ encounters: [V1_ENCOUNTER] }, 1);
    const enc = migrated.encounters[0]!;
    expect(enc.initiative).toEqual({ round: 1, activeIndex: null });
    expect(enc.tips).toBeNull();
    expect(enc.tipsGeneratedAt).toBeNull();
  });

  it("backfills initiativeMod + initiative on party members", () => {
    const migrated = migrateEncounterLibrary({ encounters: [V1_ENCOUNTER] }, 1);
    const pc = migrated.encounters[0]!.partyMembers[0]!;
    expect(pc.initiativeMod).toBe(0);
    expect(pc.initiative).toBeNull();
    expect(pc.name).toBe("Frodo");
    expect(pc.level).toBe(3);
  });

  it("backfills initiative on combatants without dropping existing fields", () => {
    const migrated = migrateEncounterLibrary({ encounters: [V1_ENCOUNTER] }, 1);
    const c = migrated.encounters[0]!.combatants[0]!;
    expect(c.initiative).toBeNull();
    expect(c.maxHp).toBe(7);
    expect(c.currentHp).toBe(5);
    expect(c.monsterCrNumeric).toBe(0.25);
    expect(c.side).toBe("enemy");
    expect(c.monsterName).toBe("Goblin");
  });

  it("coerces an encounter with malformed fields rather than dropping it", () => {
    const migrated = migrateEncounterLibrary(
      {
        encounters: [
          {
            id: "broken",
            ruleset: "weird-value",
            // missing name, partyMembers, combatants, timestamps
          },
        ],
      },
      1
    );
    const enc = migrated.encounters[0]!;
    expect(enc.id).toBe("broken");
    expect(enc.name).toBe("Untitled encounter");
    // ruleset is always coerced to "advanced"
    expect(enc.ruleset).toBe("advanced");
    expect(enc.partyMembers).toEqual([]);
    expect(enc.combatants).toEqual([]);
    expect(enc.initiative).toEqual({ round: 1, activeIndex: null });
  });

  it("coerces old 'basic' ruleset to 'advanced' during migration", () => {
    const migrated = migrateEncounterLibrary({ encounters: [V1_ENCOUNTER] }, 1);
    expect(migrated.encounters[0]!.ruleset).toBe("advanced");
  });

  it("treats non-object persisted state as empty", () => {
    expect(migrateEncounterLibrary(null, 1)).toEqual({
      encounters: [],
      savedParty: [],
      templates: [],
    });
    expect(migrateEncounterLibrary(undefined, 1)).toEqual({
      encounters: [],
      savedParty: [],
      templates: [],
    });
    expect(migrateEncounterLibrary("garbage", 1)).toEqual({
      encounters: [],
      savedParty: [],
      templates: [],
    });
  });

  it("preserves an already-v2 encounter's initiative pointer", () => {
    const v2 = {
      id: "enc-new",
      name: "New",
      ruleset: "advanced",
      partyMembers: [],
      combatants: [],
      initiative: { round: 3, activeIndex: 1 },
      tips: null,
      tipsGeneratedAt: null,
      createdAt: 100,
      updatedAt: 200,
    };
    const migrated = migrateEncounterLibrary({ encounters: [v2] }, 2);
    expect(migrated.encounters[0]!.initiative).toEqual({
      round: 3,
      activeIndex: 1,
    });
  });

  it("backfills conditions array on combatants (v3 → v4)", () => {
    const v3Encounter = {
      ...V1_ENCOUNTER,
      initiative: { round: 1, activeIndex: null },
      tips: null,
      tipsGeneratedAt: null,
      combatants: [
        {
          id: "c-1",
          monsterId: "m-goblin",
          monsterName: "Goblin",
          monsterCrNumeric: 0.25,
          side: "enemy",
          maxHp: 7,
          currentHp: 7,
          initiative: null,
          // no conditions field — v3 shape
        },
      ],
    };
    const migrated = migrateEncounterLibrary({ encounters: [v3Encounter] }, 3);
    const c = migrated.encounters[0]!.combatants[0]!;
    expect(c.conditions).toEqual([]);
  });

  it("preserves combatant nameOverride and position when present", () => {
    const migrated = migrateEncounterLibrary(
      {
        encounters: [
          {
            ...V1_ENCOUNTER,
            combatants: [
              {
                id: "c-1",
                monsterId: "m-goblin",
                monsterName: "Goblin",
                monsterCrNumeric: 0.25,
                side: "enemy",
                maxHp: 7,
                currentHp: 7,
                nameOverride: "Boss",
                position: { x: 3, y: 4 },
              },
            ],
          },
        ],
      },
      1
    );
    const c = migrated.encounters[0]!.combatants[0]!;
    expect(c.nameOverride).toBe("Boss");
    expect(c.position).toEqual({ x: 3, y: 4 });
  });
});

describe("savedParty persistence (v4 → v5)", () => {
  it("migration from v4 (no savedParty) produces savedParty: []", () => {
    const migrated = migrateEncounterLibrary({ encounters: [] }, 4);
    expect(migrated.savedParty).toEqual([]);
  });

  it("migration preserves valid savedParty entries and coerces bad ones", () => {
    const migrated = migrateEncounterLibrary(
      {
        encounters: [],
        savedParty: [
          { name: "Alice", level: 5 },
          { name: "Bob", level: 99 }, // level clamped to 20
          { name: 42, level: 3 }, // name coerced to fallback
          "not an object", // filtered out
        ],
      },
      4
    );
    expect(migrated.savedParty).toEqual([
      { name: "Alice", level: 5 },
      { name: "Bob", level: 20 },
      { name: "PC", level: 3 },
    ]);
  });
});

describe("savedParty store integration", () => {
  beforeEach(() => {
    useEncounterLibraryStore.setState({ encounters: [], savedParty: [] });
  });

  it("setSavedParty updates savedParty in the store", () => {
    useEncounterLibraryStore
      .getState()
      .setSavedParty([{ name: "Alice", level: 5 }]);
    expect(useEncounterLibraryStore.getState().savedParty).toEqual([
      { name: "Alice", level: 5 },
    ]);
  });

  it("createEncounter auto-populates party members from savedParty", () => {
    useEncounterLibraryStore
      .getState()
      .setSavedParty([{ name: "Alice", level: 5 }]);
    useEncounterLibraryStore.getState().createEncounter();
    const encounter = useEncounterLibraryStore.getState().encounters[0]!;
    expect(encounter.partyMembers).toHaveLength(1);
    expect(encounter.partyMembers[0]!.name).toBe("Alice");
    expect(encounter.partyMembers[0]!.level).toBe(5);
    expect(encounter.partyMembers[0]!.kind).toBe("pc");
    expect(encounter.partyMembers[0]!.initiativeMod).toBe(0);
    expect(encounter.partyMembers[0]!.initiative).toBeNull();
  });

  it("createEncounter with empty savedParty creates encounter with no party members", () => {
    useEncounterLibraryStore.getState().createEncounter();
    const encounter = useEncounterLibraryStore.getState().encounters[0]!;
    expect(encounter.partyMembers).toEqual([]);
  });
});
