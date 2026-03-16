import { describe, expect, it } from "vitest";

import type { Spell } from "@/lib/domain/spell.schema";
import { DEFAULT_SPELL_FILTERS } from "@/page/spells/constants";
import type { SpellFilters } from "@/page/spells/types";
import { filterSpells } from "@/page/spells/utils/filterSpells";

const baseSpell: Omit<
  Spell,
  "id" | "name" | "nameNormalized" | "classes" | "concentration" | "components"
> = {
  castingTime: "1 action",
  createdAt: "2026-01-01T00:00:00.000Z",
  createdBy: "test",
  description: ["test"],
  duration: "Instantaneous",
  isPublished: true,
  level: 1,
  range: "60 feet",
  ritual: false,
  schemaVersion: 1,
  school: "evocation",
  source: "PHB",
  updatedAt: "2026-01-01T00:00:00.000Z",
  updatedBy: "test",
};

const spell = (
  id: string,
  {
    classes,
    concentration,
    components,
    name,
    level,
    school,
  }: {
    classes: string[];
    concentration: boolean;
    components: Spell["components"];
    name: string;
    level?: number;
    school?: Spell["school"];
  }
): Spell => ({
  ...baseSpell,
  classes,
  concentration,
  components,
  id,
  level: level ?? baseSpell.level,
  name,
  nameNormalized: name.toLowerCase(),
  school: school ?? baseSpell.school,
});

function withFilters(patch: Partial<SpellFilters>): SpellFilters {
  return {
    ...DEFAULT_SPELL_FILTERS,
    ...patch,
  };
}

// Eight test spells with varied attributes
const spells: Spell[] = [
  spell("spell-1", {
    classes: ["wizard"],
    concentration: false,
    components: { material: false, somatic: true, verbal: true },
    name: "Arcane Missile",
    level: 1,
    school: "evocation",
  }),
  spell("spell-2", {
    classes: ["cleric"],
    concentration: true,
    components: { material: true, somatic: false, verbal: true },
    name: "Fire Shield",
    level: 4,
    school: "evocation",
  }),
  spell("spell-3", {
    classes: ["bard", "wizard"],
    concentration: false,
    components: { material: false, somatic: true, verbal: false },
    name: "Fireball",
    level: 3,
    school: "evocation",
  }),
  spell("spell-4", {
    classes: ["druid"],
    concentration: true,
    components: { material: false, somatic: true, verbal: true },
    name: "Entangle",
    level: 1,
    school: "conjuration",
  }),
  spell("spell-5", {
    classes: ["paladin", "cleric"],
    concentration: false,
    components: { material: false, somatic: false, verbal: true },
    name: "Sacred Flame",
    level: 0,
    school: "evocation",
  }),
  spell("spell-6", {
    classes: ["wizard"],
    concentration: true,
    components: { material: true, somatic: true, verbal: true },
    name: "Detect Magic",
    level: 1,
    school: "divination",
  }),
  spell("spell-7", {
    classes: ["sorcerer", "wizard"],
    concentration: false,
    components: { material: false, somatic: true, verbal: true },
    name: "Fire Bolt",
    level: 0,
    school: "evocation",
  }),
  spell("spell-8", {
    classes: ["ranger"],
    concentration: false,
    components: { material: true, somatic: true, verbal: false },
    name: "Hunter's Mark",
    level: 1,
    school: "divination",
  }),
];

describe("spell list pre-filter composition", () => {
  function applyListPreFilter(
    allSpells: Spell[],
    listSpellIds: string[] | null
  ): Spell[] {
    if (!listSpellIds) return allSpells;
    const idSet = new Set(listSpellIds);
    return allSpells.filter((s) => idSet.has(s.id));
  }

  it("passes all spells through when no list is active", () => {
    // listSpellIds = null → all spells pass through pre-filter unchanged
    const preFiltered = applyListPreFilter(spells, null);
    // DEFAULT_SPELL_FILTERS has no active criteria → all spells returned
    const result = filterSpells(preFiltered, DEFAULT_SPELL_FILTERS);
    expect(result.map((s) => s.id)).toEqual([
      "spell-1",
      "spell-2",
      "spell-3",
      "spell-4",
      "spell-5",
      "spell-6",
      "spell-7",
      "spell-8",
    ]);
  });

  it("scopes spells to list members", () => {
    // 8 spells total, list contains 3 IDs → only those 3 pass through
    const listIds = ["spell-2", "spell-5", "spell-7"];
    const preFiltered = applyListPreFilter(spells, listIds);
    const result = filterSpells(preFiltered, DEFAULT_SPELL_FILTERS);
    expect(result.map((s) => s.id)).toEqual(["spell-2", "spell-5", "spell-7"]);
  });

  it("composes list filter with text search", () => {
    // list scopes to 4 spells, search query "fire" narrows to 2 ("Fire Shield", "Fireball")
    const listIds = ["spell-2", "spell-3", "spell-4", "spell-8"];
    const preFiltered = applyListPreFilter(spells, listIds);
    const result = filterSpells(preFiltered, withFilters({ query: "fire" }));
    expect(result.map((s) => s.id)).toEqual(["spell-2", "spell-3"]);
  });

  it("composes list filter with school filter", () => {
    // list scopes to 5 spells (spell-1 through spell-5),
    // school=evocation narrows to 4 (spell-1, spell-2, spell-3, spell-5 are all evocation)
    // while spell-4 (conjuration) is excluded
    const listIds = ["spell-1", "spell-2", "spell-3", "spell-4", "spell-5"];
    const preFiltered = applyListPreFilter(spells, listIds);
    const result = filterSpells(
      preFiltered,
      withFilters({ school: ["evocation"] })
    );
    expect(result.map((s) => s.id)).toEqual([
      "spell-1",
      "spell-2",
      "spell-3",
      "spell-5",
    ]);
  });

  it("composes list filter with level filter", () => {
    // list scopes to 4 spells, level=3 narrows to 1 (spell-3, Fireball)
    const listIds = ["spell-1", "spell-3", "spell-5", "spell-7"];
    const preFiltered = applyListPreFilter(spells, listIds);
    const result = filterSpells(preFiltered, withFilters({ level: "3" }));
    expect(result.map((s) => s.id)).toEqual(["spell-3"]);
  });

  it("handles list with stale spell IDs gracefully", () => {
    // list contains IDs not present in the spell array → those are silently excluded
    const listIds = ["spell-1", "spell-999", "spell-000"];
    const preFiltered = applyListPreFilter(spells, listIds);
    const result = filterSpells(preFiltered, DEFAULT_SPELL_FILTERS);
    // Only spell-1 exists; stale IDs are dropped without error
    expect(result.map((s) => s.id)).toEqual(["spell-1"]);
  });

  it("returns empty array for empty list", () => {
    // Active list with 0 spellIds → 0 spells shown
    const listIds: string[] = [];
    const preFiltered = applyListPreFilter(spells, listIds);
    const result = filterSpells(preFiltered, DEFAULT_SPELL_FILTERS);
    expect(result).toEqual([]);
  });

  it("composes list filter with multiple attribute filters", () => {
    // list scopes to spells 2, 3, 4, 6 then level + concentration filters compose
    // spell-2: level 4, concentration true  ✓ (level≠3 → excluded by level filter)
    // spell-3: level 3, concentration false ✗ (fails concentration=yes)
    // spell-4: level 1, concentration true  ✗ (fails level=3)
    // spell-6: level 1, concentration true  ✗ (fails level=3)
    // → no results because no spell in the list is both level=3 AND concentration=yes
    const listIds = ["spell-2", "spell-3", "spell-4", "spell-6"];
    const preFiltered = applyListPreFilter(spells, listIds);
    const result = filterSpells(
      preFiltered,
      withFilters({ level: "3", concentration: "yes" })
    );
    expect(result).toEqual([]);
  });
});
