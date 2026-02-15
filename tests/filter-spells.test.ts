import { describe, expect, it } from "vitest";

import type { Spell } from "@/lib/domain/spell.schema";
import { DEFAULT_SPELL_FILTERS } from "@/page/spells/constants";
import type { SpellFilters } from "@/page/spells/types";
import { filterSpells } from "@/page/spells/utils/filterSpells";
import { getSpellFilterGroups } from "@/page/spells/utils/getSpellFilterGroups";

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
    attackType,
    castingTime,
    classes,
    concentration,
    components,
    damageType,
    duration,
    name,
    range,
    saveAbility,
    school,
    source,
  }: {
    attackType?: NonNullable<Spell["attackType"]>;
    castingTime?: string;
    classes: string[];
    concentration: boolean;
    components: Spell["components"];
    damageType?: string;
    duration?: string;
    name: string;
    range?: string;
    saveAbility?: NonNullable<Spell["save"]>["ability"];
    school?: Spell["school"];
    source?: string;
  }
): Spell => ({
  ...baseSpell,
  attackType,
  castingTime: castingTime ?? baseSpell.castingTime,
  classes,
  concentration,
  components,
  damage: damageType ? { type: damageType } : undefined,
  duration: duration ?? baseSpell.duration,
  id,
  name,
  nameNormalized: name.toLowerCase(),
  range: range ?? baseSpell.range,
  save: saveAbility ? { ability: saveAbility } : undefined,
  school: school ?? baseSpell.school,
  source: source ?? baseSpell.source,
});

const spells: Spell[] = [
  spell("a", {
    attackType: "ranged",
    classes: ["bard", "cleric"],
    concentration: true,
    components: { material: false, somatic: true, verbal: true },
    damageType: "radiant",
    name: "Harmony Field",
    saveAbility: "wis",
    school: "abjuration",
  }),
  spell("b", {
    attackType: "melee",
    classes: ["bard"],
    concentration: false,
    components: { material: false, somatic: false, verbal: true },
    damageType: "thunder",
    name: "Song Lash",
    saveAbility: "cha",
    school: "enchantment",
  }),
  spell("c", {
    classes: ["wizard"],
    concentration: true,
    components: { material: true, somatic: true, verbal: false },
    damageType: "force",
    name: "Focused Orb",
    saveAbility: "dex",
    school: "evocation",
  }),
];

function withFilters(patch: Partial<SpellFilters>): SpellFilters {
  return {
    ...DEFAULT_SPELL_FILTERS,
    ...patch,
  };
}

describe("filterSpells", () => {
  it("applies AND between active groups by default", () => {
    const filtered = filterSpells(
      spells,
      withFilters({
        classes: ["bard"],
        concentration: "yes",
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["a"]);
  });

  it("can apply OR between active groups", () => {
    const filtered = filterSpells(
      spells,
      withFilters({
        classes: ["bard"],
        concentration: "yes",
        groupMatchMode: "or",
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("applies OR within classes when multiple classes are selected", () => {
    const filtered = filterSpells(
      spells,
      withFilters({
        classes: ["cleric", "wizard"],
        selectionModeByKey: {
          ...DEFAULT_SPELL_FILTERS.selectionModeByKey,
          classes: "multi",
        },
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["a", "c"]);
  });

  it("applies AND within classes when configured", () => {
    const filtered = filterSpells(
      spells,
      withFilters({
        classes: ["bard", "cleric"],
        groupMatchModeByKey: {
          ...DEFAULT_SPELL_FILTERS.groupMatchModeByKey,
          classes: "and",
        },
        selectionModeByKey: {
          ...DEFAULT_SPELL_FILTERS.selectionModeByKey,
          classes: "multi",
        },
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["a"]);
  });

  it("filters by school with OR mode", () => {
    const filtered = filterSpells(
      spells,
      withFilters({
        school: ["abjuration", "evocation"],
        selectionModeByKey: {
          ...DEFAULT_SPELL_FILTERS.selectionModeByKey,
          school: "multi",
        },
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["a", "c"]);
  });

  it("filters by attack type", () => {
    const filtered = filterSpells(
      spells,
      withFilters({
        attackType: ["melee"],
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["b"]);
  });

  it("applies AND within components when configured", () => {
    const filtered = filterSpells(
      spells,
      withFilters({
        component: ["verbal", "somatic"],
        groupMatchModeByKey: {
          ...DEFAULT_SPELL_FILTERS.groupMatchModeByKey,
          component: "and",
        },
        selectionModeByKey: {
          ...DEFAULT_SPELL_FILTERS.selectionModeByKey,
          component: "multi",
        },
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["a"]);
  });

  it("normalizes range filter to primary range", () => {
    const rangeSpells: Spell[] = [
      spell("touch-a", {
        classes: ["wizard"],
        concentration: false,
        components: { material: false, somatic: true, verbal: true },
        name: "Touch Aura",
        range: "Touch (20-foot radius)",
      }),
      spell("touch-b", {
        classes: ["wizard"],
        concentration: false,
        components: { material: false, somatic: true, verbal: true },
        name: "Pure Touch",
        range: "Touch",
      }),
    ];

    const filtered = filterSpells(
      rangeSpells,
      withFilters({
        range: "Touch",
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["touch-a", "touch-b"]);
  });

  it("normalizes casting time filter by stripping reaction condition", () => {
    const castingSpells: Spell[] = [
      spell("react-a", {
        castingTime:
          "1 reaction, which you take when a creature you can see attacks",
        classes: ["wizard"],
        concentration: false,
        components: { material: false, somatic: true, verbal: true },
        name: "Quick Ward",
      }),
      spell("react-b", {
        castingTime: "1 reaction",
        classes: ["wizard"],
        concentration: false,
        components: { material: false, somatic: true, verbal: true },
        name: "Snap Shield",
      }),
    ];

    const filtered = filterSpells(
      castingSpells,
      withFilters({
        castingTime: "1 reaction",
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["react-a", "react-b"]);
  });

  it("normalizes duration filter by removing concentration prefix", () => {
    const durationSpells: Spell[] = [
      spell("dur-a", {
        classes: ["wizard"],
        concentration: true,
        components: { material: false, somatic: true, verbal: true },
        duration: "Concentration, up to 10 minutes",
        name: "Focused Cloud",
      }),
      spell("dur-b", {
        classes: ["wizard"],
        concentration: false,
        components: { material: false, somatic: true, verbal: true },
        duration: "10 minutes",
        name: "Timed Mist",
      }),
    ];

    const filtered = filterSpells(
      durationSpells,
      withFilters({
        duration: "10 minutes",
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["dur-a", "dur-b"]);
  });

  it("filters spells missing class data", () => {
    const missingClassSpells: Spell[] = [
      spell("has-classes", {
        classes: ["wizard"],
        concentration: false,
        components: { material: false, somatic: true, verbal: true },
        name: "Typed Spell",
      }),
      spell("missing-classes", {
        classes: [],
        concentration: false,
        components: { material: false, somatic: true, verbal: true },
        name: "Untyped Spell",
      }),
    ];

    const filtered = filterSpells(
      missingClassSpells,
      withFilters({
        classData: "missing",
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["missing-classes"]);
  });

  it("filters by save ability with OR mode", () => {
    const filtered = filterSpells(
      spells,
      withFilters({
        saveAbility: ["wis", "dex"],
        selectionModeByKey: {
          ...DEFAULT_SPELL_FILTERS.selectionModeByKey,
          saveAbility: "multi",
        },
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["a", "c"]);
  });

  it("filters by save ability with AND mode", () => {
    const filtered = filterSpells(
      spells,
      withFilters({
        groupMatchModeByKey: {
          ...DEFAULT_SPELL_FILTERS.groupMatchModeByKey,
          saveAbility: "and",
        },
        saveAbility: ["wis", "dex"],
        selectionModeByKey: {
          ...DEFAULT_SPELL_FILTERS.selectionModeByKey,
          saveAbility: "multi",
        },
      })
    );

    expect(filtered).toEqual([]);
  });

  it("filters by damage type", () => {
    const filtered = filterSpells(
      spells,
      withFilters({
        damageType: ["force"],
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["c"]);
  });

  it("filters by source with OR mode", () => {
    const sourceSpells: Spell[] = [
      spell("source-a", {
        classes: ["wizard"],
        concentration: false,
        components: { material: false, somatic: true, verbal: true },
        name: "Arcane Mark",
        source: "PHB",
      }),
      spell("source-b", {
        classes: ["wizard"],
        concentration: false,
        components: { material: false, somatic: true, verbal: true },
        name: "Chaos Spark",
        source: "XGE",
      }),
      spell("source-c", {
        classes: ["wizard"],
        concentration: false,
        components: { material: false, somatic: true, verbal: true },
        name: "Deep Sigil",
        source: "TCE",
      }),
    ];

    const filtered = filterSpells(
      sourceSpells,
      withFilters({
        selectionModeByKey: {
          ...DEFAULT_SPELL_FILTERS.selectionModeByKey,
          source: "multi",
        },
        source: ["PHB", "XGE"],
      })
    );

    expect(filtered.map((item) => item.id)).toEqual(["source-a", "source-b"]);
  });

  it("parses descriptive damage text into distinct damage types", () => {
    const mixedDamageSpells: Spell[] = [
      spell("mix-a", {
        classes: ["wizard"],
        concentration: false,
        components: { material: false, somatic: true, verbal: true },
        damageType: "Acid, cold, fire, lightning, or poison",
        name: "Elemental Burst",
      }),
      spell("mix-b", {
        classes: ["wizard"],
        concentration: false,
        components: { material: false, somatic: true, verbal: true },
        damageType: "Radiant or necrotic",
        name: "Twin Light",
      }),
      spell("mix-c", {
        classes: ["wizard"],
        concentration: false,
        components: { material: false, somatic: true, verbal: true },
        damageType: "Nonmagical weapon/ammunition damage",
        name: "Physical Barrier",
      }),
    ];

    const acidFiltered = filterSpells(
      mixedDamageSpells,
      withFilters({
        damageType: ["acid"],
      })
    );
    const necroticFiltered = filterSpells(
      mixedDamageSpells,
      withFilters({
        damageType: ["necrotic"],
      })
    );
    const nonMagicalFiltered = filterSpells(
      mixedDamageSpells,
      withFilters({
        damageType: ["non-magical"],
      })
    );

    expect(acidFiltered.map((item) => item.id)).toEqual(["mix-a"]);
    expect(necroticFiltered.map((item) => item.id)).toEqual(["mix-b"]);
    expect(nonMagicalFiltered.map((item) => item.id)).toEqual(["mix-c"]);
  });

  it("builds damage type options from distinct canonical types only", () => {
    const groups = getSpellFilterGroups([
      spell("opt-a", {
        attackType: "ranged",
        classes: ["wizard"],
        concentration: false,
        components: { material: false, somatic: true, verbal: true },
        damageType: "Acid, cold, fire, lightning, or poison",
        name: "Elemental Burst",
        school: "conjuration",
      }),
      spell("opt-b", {
        attackType: "melee",
        classes: ["wizard"],
        concentration: false,
        components: { material: false, somatic: true, verbal: true },
        damageType: "Radiant/necrotic",
        name: "Dual Light",
      }),
      spell("opt-c", {
        classes: ["wizard"],
        concentration: false,
        components: { material: false, somatic: true, verbal: true },
        damageType: "Nonmagical weapon/ammunition damage",
        name: "Physical Barrier",
      }),
      spell("opt-d", {
        classes: ["wizard"],
        concentration: false,
        components: { material: false, somatic: true, verbal: true },
        damageType: "See text",
        name: "Unknown Effect",
      }),
    ]);

    const damageTypeGroup = groups.find((group) => group.key === "damageType");
    const schoolGroup = groups.find((group) => group.key === "school");
    const attackTypeGroup = groups.find((group) => group.key === "attackType");
    expect(damageTypeGroup?.options.map((option) => option.value)).toEqual([
      "all",
      "acid",
      "cold",
      "fire",
      "lightning",
      "necrotic",
      "non-magical",
      "poison",
      "radiant",
    ]);
    expect(schoolGroup?.options.map((option) => option.value)).toEqual([
      "all",
      "conjuration",
      "evocation",
    ]);
    expect(attackTypeGroup?.options.map((option) => option.value)).toEqual([
      "all",
      "melee",
      "ranged",
    ]);
  });
});
