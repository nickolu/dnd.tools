import type { Spell } from "@/lib/domain/spell.schema";
import { ALL_FILTER_VALUE } from "@/page/spells/constants";
import type { SpellFilters } from "@/page/spells/types";

function hasActiveSpellFilters(filters: SpellFilters): boolean {
  return (
    Boolean(filters.query.trim()) ||
    filters.castingTime !== ALL_FILTER_VALUE ||
    filters.range !== ALL_FILTER_VALUE ||
    filters.duration !== ALL_FILTER_VALUE ||
    filters.component !== ALL_FILTER_VALUE ||
    filters.concentration !== ALL_FILTER_VALUE ||
    filters.ritual !== ALL_FILTER_VALUE ||
    filters.classes !== ALL_FILTER_VALUE ||
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
    if (
      filters.castingTime !== ALL_FILTER_VALUE &&
      spell.castingTime !== filters.castingTime
    ) {
      return false;
    }

    if (filters.range !== ALL_FILTER_VALUE && spell.range !== filters.range) {
      return false;
    }

    if (
      filters.duration !== ALL_FILTER_VALUE &&
      spell.duration !== filters.duration
    ) {
      return false;
    }

    if (
      filters.component === "verbal" &&
      !spell.components.verbal
    ) {
      return false;
    }

    if (
      filters.component === "somatic" &&
      !spell.components.somatic
    ) {
      return false;
    }

    if (
      filters.component === "material" &&
      !spell.components.material
    ) {
      return false;
    }

    if (
      filters.concentration === "yes" &&
      !spell.concentration
    ) {
      return false;
    }

    if (
      filters.concentration === "no" &&
      spell.concentration
    ) {
      return false;
    }

    if (filters.ritual === "yes" && !spell.ritual) {
      return false;
    }

    if (filters.ritual === "no" && spell.ritual) {
      return false;
    }

    if (
      filters.classes !== ALL_FILTER_VALUE &&
      !spell.classes.includes(filters.classes)
    ) {
      return false;
    }

    if (filters.level !== ALL_FILTER_VALUE && spell.level !== Number(filters.level)) {
      return false;
    }

    if (filters.source !== ALL_FILTER_VALUE && spell.source !== filters.source) {
      return false;
    }

    if (query && !spell.nameNormalized.includes(query)) {
      return false;
    }

    return true;
  });
}
