import type { ReadonlyURLSearchParams } from "next/navigation";
import { useMemo } from "react";

import type { Spell } from "@/lib/domain/spell.schema";
import {
  DEFAULT_SPELL_FILTERS,
  SPELL_SCHOOL_FILTERS,
} from "@/page/spells/constants";
import type { SpellFilters } from "@/page/spells/types";
import { filterSpells } from "@/page/spells/utils/filterSpells";

type SearchParamsInput = URLSearchParams | ReadonlyURLSearchParams;

function isSpellSchoolFilter(value: string): value is SpellFilters["school"] {
  return SPELL_SCHOOL_FILTERS.some((school) => school === value);
}

function parseSpellFilters(searchParams: SearchParamsInput): SpellFilters {
  const query = searchParams.get("q")?.trim() ?? "";
  const schoolCandidate =
    searchParams.get("school") ?? searchParams.get("filter") ?? "all";
  const school = isSpellSchoolFilter(schoolCandidate)
    ? schoolCandidate
    : DEFAULT_SPELL_FILTERS.school;

  return {
    query,
    school,
  };
}

export function useSpellFilters(spells: Spell[], searchParams: SearchParamsInput) {
  const filters = useMemo(() => parseSpellFilters(searchParams), [searchParams]);
  const filteredSpells = useMemo(() => filterSpells(spells, filters), [filters, spells]);

  return {
    filteredSpells,
    filters,
  };
}
