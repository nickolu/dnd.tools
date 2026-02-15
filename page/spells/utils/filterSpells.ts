import type { Spell } from "@/lib/domain/spell.schema";
import { ALL_FILTER_VALUE } from "@/page/spells/constants";
import type { SpellFilters } from "@/page/spells/types";
import {
  normalizeSpellCastingTimeForFilter,
  normalizeSpellDurationForFilter,
  normalizeSpellRangeForFilter,
} from "@/page/spells/utils/normalizeSpellFilterValues";

function hasActiveSpellFilters(filters: SpellFilters): boolean {
  return (
    Boolean(filters.query.trim()) ||
    filters.castingTime !== ALL_FILTER_VALUE ||
    filters.range !== ALL_FILTER_VALUE ||
    filters.duration !== ALL_FILTER_VALUE ||
    filters.component.length > 0 ||
    filters.concentration !== ALL_FILTER_VALUE ||
    filters.ritual !== ALL_FILTER_VALUE ||
    filters.classes.length > 0 ||
    filters.level !== ALL_FILTER_VALUE ||
    filters.source !== ALL_FILTER_VALUE
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

    if (filters.castingTime !== ALL_FILTER_VALUE) {
      checks.push(
        normalizeSpellCastingTimeForFilter(spell.castingTime) === filters.castingTime
      );
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

    if (filters.level !== ALL_FILTER_VALUE) {
      checks.push(spell.level === Number(filters.level));
    }

    if (filters.source !== ALL_FILTER_VALUE) {
      checks.push(spell.source === filters.source);
    }

    if (!checks.length) {
      return true;
    }

    return filters.groupMatchMode === "or"
      ? checks.some(Boolean)
      : checks.every(Boolean);
  });
}
