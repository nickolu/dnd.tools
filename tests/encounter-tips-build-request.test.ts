import { describe, expect, it } from "vitest";

import type { Encounter } from "@/lib/domain/encounter/encounter.schema";
import type { Monster } from "@/lib/domain/monster.schema";
import { buildTipsRequest } from "@/page/encounters/utils/buildTipsRequest";

function mockMonster(overrides: Partial<Monster> = {}): Monster {
  const base: Monster = {
    id: "m-goblin",
    name: "Goblin",
    nameNormalized: "goblin",
    challengeRating: "1/4",
    crNumeric: 0.25,
    hitPoints: "7",
    armorClass: "15",
    size: "Small",
    type: "humanoid",
    alignment: "neutral evil",
    source: "TEST",
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

function mockEncounter(overrides: Partial<Encounter> = {}): Encounter {
  const base: Encounter = {
    id: "e1",
    name: "Test",
    ruleset: "advanced",
    partyMembers: [],
    combatants: [],
    initiative: { round: 1, activeIndex: null },
    tips: null,
    tipsGeneratedAt: null,
    createdAt: 0,
    updatedAt: 0,
  };
  return { ...base, ...overrides };
}

describe("buildTipsRequest", () => {
  it("collapses repeated enemies into one entry with count", () => {
    const goblin = mockMonster();
    const encounter = mockEncounter({
      combatants: [
        {
          id: "c1",
          monsterId: "m-goblin",
          monsterName: "Goblin",
          monsterCrNumeric: 0.25,
          side: "enemy",
          maxHp: 7,
          currentHp: 7,
          initiative: null,
        },
        {
          id: "c2",
          monsterId: "m-goblin",
          monsterName: "Goblin",
          monsterCrNumeric: 0.25,
          side: "enemy",
          maxHp: 7,
          currentHp: 7,
          initiative: null,
        },
        {
          id: "c3",
          monsterId: "m-goblin",
          monsterName: "Goblin",
          monsterCrNumeric: 0.25,
          side: "enemy",
          maxHp: 7,
          currentHp: 7,
          initiative: null,
        },
      ],
    });
    const monstersById = new Map([["m-goblin", goblin]]);
    const result = buildTipsRequest(encounter, monstersById, "Brutal");
    expect(result.combatants).toHaveLength(1);
    expect(result.combatants[0]!.count).toBe(3);
    expect(result.combatants[0]!.cr).toBe("1/4");
  });

  it("includes only enemy combatants, not allies", () => {
    const goblin = mockMonster();
    const imp = mockMonster({
      id: "m-imp",
      name: "Imp",
      hitPoints: "10",
      crNumeric: 1,
    });
    const encounter = mockEncounter({
      combatants: [
        {
          id: "c1",
          monsterId: "m-goblin",
          monsterName: "Goblin",
          monsterCrNumeric: 0.25,
          side: "enemy",
          maxHp: 7,
          currentHp: 7,
          initiative: null,
        },
        {
          id: "c2",
          monsterId: "m-imp",
          monsterName: "Imp",
          monsterCrNumeric: 1,
          side: "ally",
          maxHp: 10,
          currentHp: 10,
          initiative: null,
        },
      ],
    });
    const monstersById = new Map([
      ["m-goblin", goblin],
      ["m-imp", imp],
    ]);
    const result = buildTipsRequest(encounter, monstersById, "Brutal");
    expect(result.combatants.map((c) => c.monsterId)).toEqual(["m-goblin"]);
  });

  it("flags legendary actions and recharge abilities in keyTraits", () => {
    const dragon = mockMonster({
      id: "m-dragon",
      name: "Adult Red Dragon",
      legendaryActions: [
        { name: "Detect", text: "The dragon makes a Wisdom check." },
      ],
      actions: [
        {
          name: "Fire Breath",
          text: "Recharge 5-6. The dragon exhales fire.",
        },
      ],
    });
    const encounter = mockEncounter({
      combatants: [
        {
          id: "c1",
          monsterId: "m-dragon",
          monsterName: "Adult Red Dragon",
          monsterCrNumeric: 17,
          side: "enemy",
          maxHp: 256,
          currentHp: 256,
          initiative: null,
        },
      ],
    });
    const monstersById = new Map([["m-dragon", dragon]]);
    const result = buildTipsRequest(encounter, monstersById, "Devastating");
    const traits = result.combatants[0]!.keyTraits;
    expect(traits).toContain("legendary actions");
    expect(traits).toContain("recharge abilities");
  });

  it("forwards party levels and party size", () => {
    const encounter = mockEncounter({
      partyMembers: [
        {
          id: "p1",
          kind: "pc",
          name: "A",
          level: 3,
          initiativeMod: 0,
          initiative: null,
        },
        {
          id: "p2",
          kind: "pc",
          name: "B",
          level: 5,
          initiativeMod: 0,
          initiative: null,
        },
      ],
    });
    const result = buildTipsRequest(encounter, new Map(), "Mild");
    expect(result.party.size).toBe(2);
    expect(result.party.levels).toEqual([3, 5]);
    expect(result.difficulty).toBe("Mild");
  });

  it("drops combatants whose monster is not in the catalog", () => {
    const encounter = mockEncounter({
      combatants: [
        {
          id: "c1",
          monsterId: "m-ghost",
          monsterName: "Ghost",
          monsterCrNumeric: 4,
          side: "enemy",
          maxHp: 1,
          currentHp: 1,
          initiative: null,
        },
      ],
    });
    const result = buildTipsRequest(encounter, new Map(), "Brutal");
    expect(result.combatants).toEqual([]);
  });
});
