import type { ReadonlyURLSearchParams } from "next/navigation";
import { useMemo } from "react";

import type { Spell } from "@/lib/domain/spell.schema";
import {
  ALL_FILTER_VALUE,
  DEFAULT_SPELL_FILTERS,
  isSpellBooleanFilter,
  isSpellComponentFilter,
  isSpellLevelFilter,
} from "@/page/spells/constants";
import type { SpellFilters } from "@/page/spells/types";
import { filterSpells } from "@/page/spells/utils/filterSpells";

type SearchParamsInput = URLSearchParams | ReadonlyURLSearchParams;

function parseSpellFilters(searchParams: SearchParamsInput): SpellFilters {
  const query = searchParams.get("q") ?? DEFAULT_SPELL_FILTERS.query;
  const castingTime =
    searchParams.get("castingTime") ?? DEFAULT_SPELL_FILTERS.castingTime;
  const range = searchParams.get("range") ?? DEFAULT_SPELL_FILTERS.range;
  const duration = searchParams.get("duration") ?? DEFAULT_SPELL_FILTERS.duration;
  const classes = searchParams.get("classes") ?? DEFAULT_SPELL_FILTERS.classes;
  const source = searchParams.get("source") ?? DEFAULT_SPELL_FILTERS.source;

  const componentCandidate =
    searchParams.get("component") ?? DEFAULT_SPELL_FILTERS.component;
  const concentrationCandidate =
    searchParams.get("concentration") ?? DEFAULT_SPELL_FILTERS.concentration;
  const ritualCandidate = searchParams.get("ritual") ?? DEFAULT_SPELL_FILTERS.ritual;
  const levelCandidate = searchParams.get("level") ?? DEFAULT_SPELL_FILTERS.level;

  return {
    castingTime: castingTime || ALL_FILTER_VALUE,
    classes: classes || ALL_FILTER_VALUE,
    component: isSpellComponentFilter(componentCandidate)
      ? componentCandidate
      : DEFAULT_SPELL_FILTERS.component,
    concentration: isSpellBooleanFilter(concentrationCandidate)
      ? concentrationCandidate
      : DEFAULT_SPELL_FILTERS.concentration,
    duration: duration || ALL_FILTER_VALUE,
    level: isSpellLevelFilter(levelCandidate)
      ? levelCandidate
      : DEFAULT_SPELL_FILTERS.level,
    query: query.trim(),
    range: range || ALL_FILTER_VALUE,
    ritual: isSpellBooleanFilter(ritualCandidate)
      ? ritualCandidate
      : DEFAULT_SPELL_FILTERS.ritual,
    source: source || ALL_FILTER_VALUE,
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
