import type { FilterGroupOption } from "@/components/filter-group";
import type { Spell } from "@/lib/domain/spell.schema";
import {
  ALL_FILTER_VALUE,
  SPELL_BOOLEAN_FILTER_OPTIONS,
  SPELL_COMPONENT_FILTER_OPTIONS,
  SPELL_LEVEL_FILTER_OPTIONS,
} from "@/page/spells/constants";
import type { SpellFilterGroup } from "@/page/spells/types";

function toTitleCase(value: string): string {
  if (!value.length) {
    return value;
  }

  return `${value[0]?.toUpperCase()}${value.slice(1)}`;
}

function sortValues(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function toOptions(values: Iterable<string>): FilterGroupOption[] {
  const sorted = sortValues(values);

  return [
    { label: "All", value: ALL_FILTER_VALUE },
    ...sorted.map((value) => ({
      label: value,
      value,
    })),
  ];
}

function getClassOptions(spells: Spell[]): FilterGroupOption[] {
  const classes = spells.flatMap((spell) => spell.classes);
  return toOptions(classes).map((option) => ({
    label:
      option.value === ALL_FILTER_VALUE
        ? option.label
        : toTitleCase(option.label),
    value: option.value,
  }));
}

export function getSpellFilterGroups(spells: Spell[]): SpellFilterGroup[] {
  return [
    {
      key: "classes",
      label: "Classes",
      options: getClassOptions(spells),
    },

    {
      key: "component",
      label: "Components",
      options: SPELL_COMPONENT_FILTER_OPTIONS,
    },
    {
      key: "level",
      label: "Level",
      options: SPELL_LEVEL_FILTER_OPTIONS,
    },
    {
      key: "range",
      label: "Range",
      options: toOptions(spells.map((spell) => spell.range)),
    },
    {
      key: "castingTime",
      label: "Casting Time",
      options: toOptions(spells.map((spell) => spell.castingTime)),
    },



    {
      key: "ritual",
      label: "Ritual",
      options: SPELL_BOOLEAN_FILTER_OPTIONS,
    },


    {
      key: "source",
      label: "Source",
      options: toOptions(spells.map((spell) => spell.source)),
    },
    {
      key: "duration",
      label: "Duration",
      options: toOptions(spells.map((spell) => spell.duration)),
    },
  ];
}
