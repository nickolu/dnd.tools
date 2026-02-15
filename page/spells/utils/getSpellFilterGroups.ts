import type { FilterGroupOption } from "@/components/filter-group";
import type { Spell } from "@/lib/domain/spell.schema";
import {
  ALL_FILTER_VALUE,
  SPELL_BOOLEAN_FILTER_OPTIONS,
  SPELL_CLASS_DATA_FILTER_OPTIONS,
  SPELL_COMPONENT_FILTER_OPTIONS,
  SPELL_LEVEL_FILTER_OPTIONS,
} from "@/page/spells/constants";
import type { SpellFilterGroup } from "@/page/spells/types";
import {
  normalizeSpellCastingTimeForFilter,
  normalizeSpellDurationForFilter,
  normalizeSpellRangeForFilter,
} from "@/page/spells/utils/normalizeSpellFilterValues";
import { parseSpellDamageTypes } from "@/page/spells/utils/spell-damage-types";

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

function getSchoolOptions(spells: Spell[]): FilterGroupOption[] {
  return toOptions(spells.map((spell) => spell.school)).map((option) => ({
    label:
      option.value === ALL_FILTER_VALUE
        ? option.label
        : toTitleCase(option.label),
    value: option.value,
  }));
}

function getAttackTypeOptions(spells: Spell[]): FilterGroupOption[] {
  const attackTypes = spells
    .map((spell) => spell.attackType?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value));

  return toOptions(attackTypes).map((option) => ({
    label:
      option.value === ALL_FILTER_VALUE
        ? option.label
        : toTitleCase(option.label),
    value: option.value,
  }));
}

function getSaveAbilityOptions(spells: Spell[]): FilterGroupOption[] {
  const abilities = spells
    .map((spell) => spell.save?.ability)
    .filter((ability): ability is NonNullable<Spell["save"]>["ability"] =>
      Boolean(ability)
    );

  return toOptions(abilities).map((option) => ({
    label:
      option.value === ALL_FILTER_VALUE ? option.label : option.label.toUpperCase(),
    value: option.value,
  }));
}

function getDamageTypeOptions(spells: Spell[]): FilterGroupOption[] {
  const damageTypes = spells.flatMap((spell) =>
    parseSpellDamageTypes(spell.damage?.type)
  );

  return toOptions(damageTypes).map((option) => ({
    label:
      option.value === ALL_FILTER_VALUE ? option.label : toTitleCase(option.label),
    value: option.value,
  }));
}

export function getSpellFilterGroups(spells: Spell[]): SpellFilterGroup[] {
  return [
    {
      key: "school",
      label: "School",
      options: getSchoolOptions(spells),
    },
    {
      key: "attackType",
      label: "Attack Type",
      options: getAttackTypeOptions(spells),
    },
    {
      key: "classes",
      label: "Classes",
      options: getClassOptions(spells),
    },
    {
      key: "classData",
      label: "Class Data",
      options: SPELL_CLASS_DATA_FILTER_OPTIONS,
    },

    {
      key: "component",
      label: "Components",
      options: SPELL_COMPONENT_FILTER_OPTIONS,
    },
    {
      key: "saveAbility",
      label: "Save Ability",
      options: getSaveAbilityOptions(spells),
    },
    {
      key: "damageType",
      label: "Damage Type",
      options: getDamageTypeOptions(spells),
    },
    {
      key: "level",
      label: "Level",
      options: SPELL_LEVEL_FILTER_OPTIONS,
    },
    {
      key: "range",
      label: "Range",
      options: toOptions(
        spells.map((spell) => normalizeSpellRangeForFilter(spell.range))
      ),
    },
    {
      key: "castingTime",
      label: "Casting Time",
      options: toOptions(
        spells.map((spell) => normalizeSpellCastingTimeForFilter(spell.castingTime))
      ),
    },
    {
      key: "concentration",
      label: "Concentration",
      options: SPELL_BOOLEAN_FILTER_OPTIONS,
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
      options: toOptions(
        spells.map((spell) => normalizeSpellDurationForFilter(spell.duration))
      ),
    },
  ];
}
