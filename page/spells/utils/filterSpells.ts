import type { Spell } from "@/lib/domain/spell.schema";
import { ALL_FILTER_VALUE } from "@/page/spells/constants";
import type { SpellFilters } from "@/page/spells/types";
import {
  normalizeSpellCastingTimeForFilter,
  normalizeSpellDurationForFilter,
  normalizeSpellRangeForFilter,
} from "@/page/spells/utils/normalizeSpellFilterValues";
import { getSpellDamageTypes } from "@/page/spells/utils/spell-damage-types";

function hasActiveSpellFilters(filters: SpellFilters): boolean {
  return (
    Boolean(filters.query.trim()) ||
    filters.school.length > 0 ||
    filters.attackType.length > 0 ||
    filters.classData !== ALL_FILTER_VALUE ||
    filters.castingTime !== ALL_FILTER_VALUE ||
    filters.range !== ALL_FILTER_VALUE ||
    filters.duration !== ALL_FILTER_VALUE ||
    filters.component.length > 0 ||
    filters.concentration !== ALL_FILTER_VALUE ||
    filters.damageType.length > 0 ||
    filters.higherLevel !== ALL_FILTER_VALUE ||
    filters.ritual !== ALL_FILTER_VALUE ||
    filters.saveAbility.length > 0 ||
    filters.classes.length > 0 ||
    filters.level !== ALL_FILTER_VALUE ||
    filters.source.length > 0
  );
}

export function filterSpells(spells: Spell[], filters: SpellFilters): Spell[] {
  if (!hasActiveSpellFilters(filters)) {
    return spells;
  }

  const query = filters.query.trim().toLowerCase();

  return spells.filter((spell) => {
    const checks: boolean[] = [];

    if (query) {
      checks.push(spell.nameNormalized.includes(query));
    }

    if (filters.school.length > 0) {
      const selected = filters.school;
      const matcher =
        filters.groupMatchModeByKey.school === "and"
          ? selected.every((value) => value === spell.school)
          : selected.some((value) => value === spell.school);
      checks.push(matcher);
    }

    if (filters.attackType.length > 0) {
      const selected = filters.attackType;
      const spellAttackType = spell.attackType;
      const matcher =
        filters.groupMatchModeByKey.attackType === "and"
          ? selected.every((value) => value === spellAttackType)
          : selected.some((value) => value === spellAttackType);
      checks.push(matcher);
    }

    if (filters.castingTime !== ALL_FILTER_VALUE) {
      checks.push(
        normalizeSpellCastingTimeForFilter(spell.castingTime) ===
          filters.castingTime
      );
    }

    if (filters.classData === "present") {
      checks.push(Array.isArray(spell.classes) && spell.classes.length > 0);
    }

    if (filters.classData === "missing") {
      checks.push(!Array.isArray(spell.classes) || spell.classes.length === 0);
    }

    if (filters.range !== ALL_FILTER_VALUE) {
      checks.push(normalizeSpellRangeForFilter(spell.range) === filters.range);
    }

    if (filters.duration !== ALL_FILTER_VALUE) {
      checks.push(
        normalizeSpellDurationForFilter(spell.duration) === filters.duration
      );
    }

    if (filters.component.length > 0) {
      const selected = filters.component;
      const matcher =
        filters.groupMatchModeByKey.component === "and"
          ? selected.every((value) => spell.components[value])
          : selected.some((value) => spell.components[value]);
      checks.push(matcher);
    }

    if (filters.concentration === "yes") {
      checks.push(Boolean(spell.concentration));
    }

    if (filters.concentration === "no") {
      checks.push(!spell.concentration);
    }

    if (filters.ritual === "yes") {
      checks.push(Boolean(spell.ritual));
    }

    if (filters.ritual === "no") {
      checks.push(!spell.ritual);
    }

    if (filters.classes.length > 0) {
      const selected = filters.classes;
      const matcher =
        filters.groupMatchModeByKey.classes === "and"
          ? selected.every((value) => spell.classes.includes(value))
          : selected.some((value) => spell.classes.includes(value));
      checks.push(matcher);
    }

    if (filters.saveAbility.length > 0) {
      const selected = filters.saveAbility;
      const spellSaveAbility = spell.save?.ability;
      const matcher =
        filters.groupMatchModeByKey.saveAbility === "and"
          ? selected.every((value) => value === spellSaveAbility)
          : selected.some((value) => value === spellSaveAbility);
      checks.push(matcher);
    }

    if (filters.damageType.length > 0) {
      const selected = filters.damageType;
      const spellDamageTypes = getSpellDamageTypes(spell);
      const matcher =
        filters.groupMatchModeByKey.damageType === "and"
          ? selected.every((value) => spellDamageTypes.includes(value))
          : selected.some((value) => spellDamageTypes.includes(value));
      checks.push(matcher);
    }

    if (filters.higherLevel === "yes") {
      checks.push(
        Array.isArray(spell.higherLevel) && spell.higherLevel.length > 0
      );
    }

    if (filters.higherLevel === "no") {
      checks.push(
        !Array.isArray(spell.higherLevel) || spell.higherLevel.length === 0
      );
    }

    if (filters.level !== ALL_FILTER_VALUE) {
      checks.push(spell.level === Number(filters.level));
    }

    if (filters.source.length > 0) {
      const selected = filters.source;
      const matcher =
        filters.groupMatchModeByKey.source === "and"
          ? selected.every((value) => value === spell.source)
          : selected.some((value) => value === spell.source);
      checks.push(matcher);
    }

    if (!checks.length) {
      return true;
    }

    return filters.groupMatchMode === "or"
      ? checks.some(Boolean)
      : checks.every(Boolean);
  });
}
