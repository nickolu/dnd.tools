import { describe, expect, it } from "vitest";

import type { Spell } from "@/lib/domain/spell.schema";
import { DEFAULT_SPELL_FILTERS } from "@/page/spells/constants";
import type { SpellFilters } from "@/page/spells/types";
import { filterSpells } from "@/page/spells/utils/filterSpells";

const baseSpell: Omit<Spell, "id" | "name" | "nameNormalized" | "classes" | "concentration" | "components"> = {
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
    castingTime,
    classes,
    concentration,
    components,
    duration,
    name,
    range,
  }: {
    castingTime?: string;
    classes: string[];
    concentration: boolean;
    components: Spell["components"];
    duration?: string;
    name: string;
    range?: string;
  }
): Spell => ({
  ...baseSpell,
  castingTime: castingTime ?? baseSpell.castingTime,
  classes,
  concentration,
  components,
  duration: duration ?? baseSpell.duration,
  id,
  name,
  nameNormalized: name.toLowerCase(),
  range: range ?? baseSpell.range,
});

const spells: Spell[] = [
  spell("a", {
    classes: ["bard", "cleric"],
    concentration: true,
    components: { material: false, somatic: true, verbal: true },
    name: "Harmony Field",
  }),
  spell("b", {
    classes: ["bard"],
    concentration: false,
    components: { material: false, somatic: false, verbal: true },
    name: "Song Lash",
  }),
  spell("c", {
    classes: ["wizard"],
    concentration: true,
    components: { material: true, somatic: true, verbal: false },
    name: "Focused Orb",
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
});
