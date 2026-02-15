import type { ReadonlyURLSearchParams } from "next/navigation";
import { useMemo } from "react";

import type { Spell } from "@/lib/domain/spell.schema";
import {
  ALL_FILTER_VALUE,
  DEFAULT_SELECTION_MODE,
  DEFAULT_SPELL_FILTERS,
  isSpellBooleanFilter,
  isSpellComponentFilter,
  isSpellLevelFilter,
  isSpellMatchMode,
  isSpellSelectionMode,
  SPELL_GROUP_MATCH_QUERY_PARAM,
  SPELL_GROUP_MATCH_QUERY_PARAM_BY_KEY,
  SPELL_SELECTION_MODE_QUERY_PARAM_BY_KEY,
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
  const source = searchParams.get("source") ?? DEFAULT_SPELL_FILTERS.source;
  const groupMatchModeCandidate =
    searchParams.get(SPELL_GROUP_MATCH_QUERY_PARAM) ??
    DEFAULT_SPELL_FILTERS.groupMatchMode;

  const componentCandidate =
    searchParams.getAll("component").length
      ? searchParams.getAll("component")
      : DEFAULT_SPELL_FILTERS.component;
  const concentrationCandidate =
    searchParams.get("concentration") ?? DEFAULT_SPELL_FILTERS.concentration;
  const ritualCandidate = searchParams.get("ritual") ?? DEFAULT_SPELL_FILTERS.ritual;
  const levelCandidate = searchParams.get("level") ?? DEFAULT_SPELL_FILTERS.level;
  const classesCandidate = searchParams.getAll("classes");
  const classesSelectionModeCandidate =
    searchParams.get(SPELL_SELECTION_MODE_QUERY_PARAM_BY_KEY.classes) ??
    DEFAULT_SPELL_FILTERS.selectionModeByKey.classes;
  const componentSelectionModeCandidate =
    searchParams.get(SPELL_SELECTION_MODE_QUERY_PARAM_BY_KEY.component) ??
    DEFAULT_SPELL_FILTERS.selectionModeByKey.component;
  const classesMatchModeCandidate =
    searchParams.get(SPELL_GROUP_MATCH_QUERY_PARAM_BY_KEY.classes) ??
    DEFAULT_SPELL_FILTERS.groupMatchModeByKey.classes;
  const componentMatchModeCandidate =
    searchParams.get(SPELL_GROUP_MATCH_QUERY_PARAM_BY_KEY.component) ??
    DEFAULT_SPELL_FILTERS.groupMatchModeByKey.component;

  const classesSelectionMode = isSpellSelectionMode(classesSelectionModeCandidate)
    ? classesSelectionModeCandidate
    : DEFAULT_SELECTION_MODE;
  const componentSelectionMode = isSpellSelectionMode(
    componentSelectionModeCandidate
  )
    ? componentSelectionModeCandidate
    : DEFAULT_SELECTION_MODE;
  const classes = [...new Set(classesCandidate.filter((value) => value !== ALL_FILTER_VALUE))];
  const components = [
    ...new Set(componentCandidate.filter((value) => isSpellComponentFilter(value))),
  ];

  return {
    castingTime: castingTime || ALL_FILTER_VALUE,
    classes:
      classesSelectionMode === "single"
        ? classes.slice(0, 1)
        : classes,
    component:
      componentSelectionMode === "single"
        ? components.slice(0, 1)
        : components,
    concentration: isSpellBooleanFilter(concentrationCandidate)
      ? concentrationCandidate
      : DEFAULT_SPELL_FILTERS.concentration,
    duration: duration || ALL_FILTER_VALUE,
    groupMatchMode: isSpellMatchMode(groupMatchModeCandidate)
      ? groupMatchModeCandidate
      : DEFAULT_SPELL_FILTERS.groupMatchMode,
    groupMatchModeByKey: {
      classes: isSpellMatchMode(classesMatchModeCandidate)
        ? classesMatchModeCandidate
        : DEFAULT_SPELL_FILTERS.groupMatchModeByKey.classes,
      component: isSpellMatchMode(componentMatchModeCandidate)
        ? componentMatchModeCandidate
        : DEFAULT_SPELL_FILTERS.groupMatchModeByKey.component,
    },
    level: isSpellLevelFilter(levelCandidate)
      ? levelCandidate
      : DEFAULT_SPELL_FILTERS.level,
    query: query.trim(),
    range: range || ALL_FILTER_VALUE,
    ritual: isSpellBooleanFilter(ritualCandidate)
      ? ritualCandidate
      : DEFAULT_SPELL_FILTERS.ritual,
    selectionModeByKey: {
      classes: classesSelectionMode,
      component: componentSelectionMode,
    },
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
