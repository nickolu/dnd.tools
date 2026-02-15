import type { Spell } from "@/lib/domain/spell.schema";
import type { SpellFilters } from "@/page/spells/types";

function hasActiveSpellFilters(filters: SpellFilters): boolean {
  return Boolean(filters.query.trim()) || filters.school !== "all";
}

export function filterSpells(spells: Spell[], filters: SpellFilters): Spell[] {
  if (!hasActiveSpellFilters(filters)) {
    return spells;
  }

  const query = filters.query.trim().toLowerCase();

  return spells.filter((spell) => {
    if (filters.school !== "all" && spell.school !== filters.school) {
      return false;
    }

    if (query && !spell.nameNormalized.includes(query)) {
      return false;
    }

    return true;
  });
}
