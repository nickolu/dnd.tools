import { describe, expect, it } from "vitest";

import type { Monster } from "@/lib/domain/monster.schema";
import type { Spell } from "@/lib/domain/spell.schema";
import { aggregateSpells } from "@/page/encounters/utils/aggregateSpells";

function makeMonster(
  id: string,
  name: string,
  spellList: string[] | undefined = undefined
): Monster {
  const base: Monster = {
    id,
    name,
    nameNormalized: name.toLowerCase(),
    challengeRating: "1",
    crNumeric: 1,
    hitPoints: "10",
    armorClass: "12",
    size: "Medium",
    type: "humanoid",
    alignment: "neutral",
    source: "TEST",
    speed: "30 ft.",
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    schemaVersion: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    createdBy: "test",
    updatedAt: "2024-01-01T00:00:00.000Z",
    updatedBy: "test",
    isPublished: true,
  };
  return spellList !== undefined ? { ...base, spellList } : base;
}

function makeSpell(id: string, name: string, level: number): Spell {
  return {
    id,
    name,
    nameNormalized: name.toLowerCase(),
    level,
    school: "evocation",
    castingTime: "1 action",
    range: "60 feet",
    duration: "Instantaneous",
    concentration: false,
    ritual: false,
    classes: ["wizard"],
    components: { verbal: true, somatic: true, material: false },
    description: ["Test description"],
    source: "TEST",
    schemaVersion: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    createdBy: "test",
    updatedAt: "2024-01-01T00:00:00.000Z",
    updatedBy: "test",
    isPublished: true,
  };
}

function buildMaps(monsters: Monster[], spells: Spell[]) {
  const monstersById = new Map(monsters.map((m) => [m.id, m]));
  const spellsByNormalizedName = new Map(
    spells.map((s) => [s.name.toLowerCase(), s])
  );
  return { monstersById, spellsByNormalizedName };
}

describe("aggregateSpells", () => {
  it("dedupes a spell that appears on two different monsters into one entry", () => {
    const m1 = makeMonster("m1", "Mage", ["Fire Bolt"]);
    const m2 = makeMonster("m2", "Cultist", ["Fire Bolt"]);
    const fireBolt = makeSpell("s1", "Fire Bolt", 0);
    const { monstersById, spellsByNormalizedName } = buildMaps(
      [m1, m2],
      [fireBolt]
    );
    const result = aggregateSpells(
      [
        { monsterId: "m1", monsterName: "Mage" },
        { monsterId: "m2", monsterName: "Cultist" },
      ],
      monstersById,
      spellsByNormalizedName
    );
    expect(result.spells).toHaveLength(1);
    expect(result.spells[0]!.casters).toHaveLength(2);
    expect(result.spells[0]!.casters.map((c) => c.monsterId).sort()).toEqual([
      "m1",
      "m2",
    ]);
  });

  it("same monster appearing twice collapses into one caster with instanceCount 2", () => {
    const m1 = makeMonster("m1", "Mage", ["Mage Armor"]);
    const mageArmor = makeSpell("s1", "Mage Armor", 1);
    const { monstersById, spellsByNormalizedName } = buildMaps(
      [m1],
      [mageArmor]
    );
    const result = aggregateSpells(
      [
        { monsterId: "m1", monsterName: "Mage" },
        { monsterId: "m1", monsterName: "Mage" },
      ],
      monstersById,
      spellsByNormalizedName
    );
    expect(result.spells).toHaveLength(1);
    expect(result.spells[0]!.casters).toHaveLength(1);
    expect(result.spells[0]!.casters[0]!.instanceCount).toBe(2);
  });

  it("matches spell names case-insensitively and trims whitespace", () => {
    const m1 = makeMonster("m1", "Mage", ["  MAGE ARMOR  "]);
    const mageArmor = makeSpell("s1", "Mage Armor", 1);
    const { monstersById, spellsByNormalizedName } = buildMaps(
      [m1],
      [mageArmor]
    );
    const result = aggregateSpells(
      [{ monsterId: "m1", monsterName: "Mage" }],
      monstersById,
      spellsByNormalizedName
    );
    expect(result.spells).toHaveLength(1);
    expect(result.unresolved).toEqual([]);
  });

  it("collects unresolved spell names rather than silently dropping", () => {
    const m1 = makeMonster("m1", "Cultist", ["Bogus Spell", "Fire Bolt"]);
    const fireBolt = makeSpell("s1", "Fire Bolt", 0);
    const { monstersById, spellsByNormalizedName } = buildMaps(
      [m1],
      [fireBolt]
    );
    const result = aggregateSpells(
      [{ monsterId: "m1", monsterName: "Cultist" }],
      monstersById,
      spellsByNormalizedName
    );
    expect(result.spells).toHaveLength(1);
    expect(result.unresolved).toEqual(["Bogus Spell"]);
  });

  it("returns empty result for no combatants", () => {
    const result = aggregateSpells([], new Map(), new Map());
    expect(result).toEqual({ spells: [], unresolved: [] });
  });

  it("skips monsters with no spellList", () => {
    const m1 = makeMonster("m1", "Brute");
    const { monstersById, spellsByNormalizedName } = buildMaps([m1], []);
    const result = aggregateSpells(
      [{ monsterId: "m1", monsterName: "Brute" }],
      monstersById,
      spellsByNormalizedName
    );
    expect(result.spells).toEqual([]);
    expect(result.unresolved).toEqual([]);
  });

  it("sorts output by level ascending then by name", () => {
    const m1 = makeMonster("m1", "Mage", [
      "Cone of Cold",
      "Fire Bolt",
      "Magic Missile",
    ]);
    const spells = [
      makeSpell("s1", "Fire Bolt", 0),
      makeSpell("s2", "Magic Missile", 1),
      makeSpell("s3", "Cone of Cold", 5),
    ];
    const { monstersById, spellsByNormalizedName } = buildMaps([m1], spells);
    const result = aggregateSpells(
      [{ monsterId: "m1", monsterName: "Mage" }],
      monstersById,
      spellsByNormalizedName
    );
    expect(result.spells.map((s) => s.spell.name)).toEqual([
      "Fire Bolt",
      "Magic Missile",
      "Cone of Cold",
    ]);
  });
});
