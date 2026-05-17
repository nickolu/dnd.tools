import { describe, expect, it } from "vitest";

import { migrateEncounterLibrary } from "@/lib/store/useEncounterLibraryStore";

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
    // ruleset falls back to "advanced" when the persisted value isn't a
    // valid enum value
    expect(enc.ruleset).toBe("advanced");
    expect(enc.partyMembers).toEqual([]);
    expect(enc.combatants).toEqual([]);
    expect(enc.initiative).toEqual({ round: 1, activeIndex: null });
  });

  it("treats non-object persisted state as empty", () => {
    expect(migrateEncounterLibrary(null, 1)).toEqual({ encounters: [] });
    expect(migrateEncounterLibrary(undefined, 1)).toEqual({ encounters: [] });
    expect(migrateEncounterLibrary("garbage", 1)).toEqual({ encounters: [] });
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
