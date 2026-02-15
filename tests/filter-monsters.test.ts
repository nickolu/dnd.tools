import { describe, expect, it } from "vitest";

import type { Monster } from "@/lib/domain/monster.schema";
import { DEFAULT_MONSTER_FILTERS } from "@/page/monsters/constants";
import type { MonsterFilters } from "@/page/monsters/types";
import { filterMonsters } from "@/page/monsters/utils/filterMonsters";

const baseMonster: Omit<
  Monster,
  "id" | "name" | "nameNormalized" | "size" | "source" | "type" | "alignment"
> = {
  abilityScores: {
    cha: 10,
    con: 10,
    dex: 10,
    int: 10,
    str: 10,
    wis: 10,
  },
  armorClass: "12",
  challengeRating: "1",
  crNumeric: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  createdBy: "test",
  hitPoints: "10",
  isPublished: true,
  schemaVersion: 1,
  speed: "30 ft.",
  updatedAt: "2026-01-01T00:00:00.000Z",
  updatedBy: "test",
};

const monster = (
  id: string,
  {
    abilityScores,
    alignment,
    armorClass,
    conditionImmunities,
    crNumeric,
    damageImmunities,
    damageResistances,
    damageVulnerabilities,
    hitPoints,
    name,
    senses,
    size,
    source,
    type,
  }: {
    abilityScores: Monster["abilityScores"];
    alignment: string;
    armorClass: string;
    conditionImmunities?: string[];
    crNumeric: number;
    damageImmunities?: string[];
    damageResistances?: string[];
    damageVulnerabilities?: string[];
    hitPoints: string;
    name: string;
    senses?: string;
    size: Monster["size"];
    source: string;
    type: string;
  }
): Monster => ({
  ...baseMonster,
  abilityScores,
  alignment,
  armorClass,
  challengeRating: String(crNumeric),
  conditionImmunities,
  crNumeric,
  damageImmunities,
  damageResistances,
  damageVulnerabilities,
  hitPoints,
  id,
  name,
  nameNormalized: name.toLowerCase(),
  senses,
  size,
  source,
  type,
});

const monsters: Monster[] = [
  monster("a", {
    abilityScores: { cha: 12, con: 16, dex: 11, int: 10, str: 18, wis: 13 },
    alignment: "lawful good",
    armorClass: "18 (plate)",
    conditionImmunities: ["charmed"],
    crNumeric: 5,
    damageResistances: ["fire"],
    hitPoints: "85 (10d8+40)",
    name: "Knight Sentinel",
    senses: "darkvision 60 ft., passive perception 11",
    size: "Medium",
    source: "MM",
    type: "humanoid (human)",
  }),
  monster("b", {
    abilityScores: { cha: 6, con: 14, dex: 15, int: 3, str: 14, wis: 8 },
    alignment: "chaotic evil",
    armorClass: "13",
    crNumeric: 2,
    damageImmunities: ["poison"],
    damageVulnerabilities: ["radiant"],
    hitPoints: "45 (6d8+18)",
    name: "Forest Stalker",
    senses: "blindsight 30 ft.",
    size: "Large",
    source: "VG",
    type: "swarm of Tiny beasts",
  }),
  monster("c", {
    abilityScores: { cha: 9, con: 18, dex: 9, int: 11, str: 20, wis: 10 },
    alignment: "unaligned",
    armorClass: "16 (natural armor)",
    conditionImmunities: ["poisoned"],
    crNumeric: 8,
    damageImmunities: ["poison"],
    damageResistances: ["cold"],
    hitPoints: "110 (13d10+39)",
    name: "Stone Servitor",
    senses: "darkvision 120 ft., tremorsense 30 ft.",
    size: "Large",
    source: "MM",
    type: "construct",
  }),
];

function withFilters(patch: Partial<MonsterFilters>): MonsterFilters {
  return {
    ...DEFAULT_MONSTER_FILTERS,
    ...patch,
  };
}

describe("filterMonsters", () => {
  it("applies AND between active groups by default", () => {
    const filtered = filterMonsters(
      monsters,
      withFilters({
        size: ["Large"],
        source: ["MM"],
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["c"]);
  });

  it("can apply OR between active groups", () => {
    const filtered = filterMonsters(
      monsters,
      withFilters({
        groupMatchMode: "or",
        size: ["Large"],
        source: ["MM"],
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("filters type by supertype only", () => {
    const filtered = filterMonsters(
      monsters,
      withFilters({
        type: ["humanoid"],
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["a"]);
  });

  it("filters alignment by lawful and moral axes", () => {
    const filtered = filterMonsters(
      monsters,
      withFilters({
        alignmentLaw: ["chaotic"],
        alignmentMoral: ["evil"],
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["b"]);
  });

  it("filters by senses and damage arrays", () => {
    const filtered = filterMonsters(
      monsters,
      withFilters({
        damageImmunities: ["poison"],
        senses: ["blindsight"],
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["b"]);
  });

  it("applies AND within a multi-select group when configured", () => {
    const filtered = filterMonsters(
      monsters,
      withFilters({
        damageImmunities: ["poison", "fire"],
        groupMatchModeByKey: {
          ...DEFAULT_MONSTER_FILTERS.groupMatchModeByKey,
          damageImmunities: "and",
        },
      })
    );

    expect(filtered).toEqual([]);
  });

  it("applies numeric range filters", () => {
    const filtered = filterMonsters(
      monsters,
      withFilters({
        rangeByKey: {
          ...DEFAULT_MONSTER_FILTERS.rangeByKey,
          crNumeric: { max: 6, min: 3 },
          hitPoints: { max: 100, min: 80 },
          str: { max: 19, min: 17 },
        },
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["a"]);
  });
});
