import type { ReadonlyURLSearchParams } from "next/navigation";
import { useMemo } from "react";

import type { Spell } from "@/lib/domain/spell.schema";
import {
  ALL_FILTER_VALUE,
  DEFAULT_SELECTION_MODE,
  DEFAULT_SPELL_FILTERS,
  isSpellAttackTypeFilter,
  isSpellBooleanFilter,
  isSpellClassDataFilter,
  isSpellComponentFilter,
  isSpellLevelFilter,
  isSpellMatchMode,
  isSpellSchoolFilter,
  isSpellSelectionMode,
  SPELL_GROUP_MATCH_QUERY_PARAM,
  SPELL_GROUP_MATCH_QUERY_PARAM_BY_KEY,
  SPELL_SELECTION_MODE_QUERY_PARAM_BY_KEY,
} from "@/page/spells/constants";
import type {
  SpellAttackTypeFilter,
  SpellDamageTypeFilter,
  SpellFilters,
  SpellSaveAbilityFilter,
  SpellSchoolFilter,
} from "@/page/spells/types";
import { filterSpells } from "@/page/spells/utils/filterSpells";
import {
  normalizeSpellCastingTimeForFilter,
  normalizeSpellDurationForFilter,
  normalizeSpellRangeForFilter,
} from "@/page/spells/utils/normalizeSpellFilterValues";
import { normalizeSpellDamageTypeFilterValue } from "@/page/spells/utils/spell-damage-types";

type SearchParamsInput = URLSearchParams | ReadonlyURLSearchParams;

type LegacySpellFilter =
  | { key: "classes"; value: string }
  | { key: "concentration"; value: "yes" | "no" }
  | { key: "level"; value: string }
  | { key: "ritual"; value: "yes" | "no" };

function isSpellSaveAbilityFilter(
  value: string
): value is SpellSaveAbilityFilter {
  return (
    value === "str" ||
    value === "dex" ||
    value === "con" ||
    value === "int" ||
    value === "wis" ||
    value === "cha"
  );
}

function parseLegacySpellFilter(
  searchParams: SearchParamsInput
): LegacySpellFilter | null {
  const raw = searchParams.get("filter")?.trim();
  if (!raw) {
    return null;
  }

  const [key, ...valueParts] = raw.split(":");
  const value = valueParts.join(":").trim();
  if (!key || !value) {
    return null;
  }

  if (key === "classes") {
    return { key, value: value.toLowerCase() };
  }

  if (key === "concentration" && (value === "yes" || value === "no")) {
    return { key, value };
  }

  if (key === "ritual" && (value === "yes" || value === "no")) {
    return { key, value };
  }

  if (key === "level") {
    return { key, value };
  }

  return null;
}

function parseSpellFilters(searchParams: SearchParamsInput): SpellFilters {
  const legacyFilter = parseLegacySpellFilter(searchParams);
  const query = searchParams.get("q") ?? DEFAULT_SPELL_FILTERS.query;
  const castingTime =
    searchParams.get("castingTime") ?? DEFAULT_SPELL_FILTERS.castingTime;
  const range = searchParams.get("range") ?? DEFAULT_SPELL_FILTERS.range;
  const classData =
    searchParams.get("classData") ?? DEFAULT_SPELL_FILTERS.classData;
  const duration =
    searchParams.get("duration") ?? DEFAULT_SPELL_FILTERS.duration;
  const higherLevelCandidate =
    searchParams.get("higherLevel") ?? DEFAULT_SPELL_FILTERS.higherLevel;
  const groupMatchModeCandidate =
    searchParams.get(SPELL_GROUP_MATCH_QUERY_PARAM) ??
    DEFAULT_SPELL_FILTERS.groupMatchMode;

  const componentCandidate = searchParams.getAll("component").length
    ? searchParams.getAll("component")
    : DEFAULT_SPELL_FILTERS.component;
  const concentrationCandidate =
    searchParams.get("concentration") ??
    (legacyFilter?.key === "concentration" ? legacyFilter.value : undefined) ??
    DEFAULT_SPELL_FILTERS.concentration;
  const ritualCandidate =
    searchParams.get("ritual") ??
    (legacyFilter?.key === "ritual" ? legacyFilter.value : undefined) ??
    DEFAULT_SPELL_FILTERS.ritual;
  const levelCandidate =
    searchParams.get("level") ??
    (legacyFilter?.key === "level" ? legacyFilter.value : undefined) ??
    DEFAULT_SPELL_FILTERS.level;
  const classesCandidate = searchParams.getAll("classes");
  const attackTypeCandidate = searchParams.getAll("attackType");
  const schoolCandidate = searchParams.getAll("school");
  const saveAbilityCandidate = searchParams.getAll("saveAbility");
  const damageTypeCandidate = searchParams.getAll("damageType");
  const sourceCandidate = searchParams.getAll("source");
  const attackTypeSelectionModeCandidate =
    searchParams.get(SPELL_SELECTION_MODE_QUERY_PARAM_BY_KEY.attackType) ??
    DEFAULT_SPELL_FILTERS.selectionModeByKey.attackType;
  const classesSelectionModeCandidate =
    searchParams.get(SPELL_SELECTION_MODE_QUERY_PARAM_BY_KEY.classes) ??
    DEFAULT_SPELL_FILTERS.selectionModeByKey.classes;
  const componentSelectionModeCandidate =
    searchParams.get(SPELL_SELECTION_MODE_QUERY_PARAM_BY_KEY.component) ??
    DEFAULT_SPELL_FILTERS.selectionModeByKey.component;
  const saveAbilitySelectionModeCandidate =
    searchParams.get(SPELL_SELECTION_MODE_QUERY_PARAM_BY_KEY.saveAbility) ??
    DEFAULT_SPELL_FILTERS.selectionModeByKey.saveAbility;
  const damageTypeSelectionModeCandidate =
    searchParams.get(SPELL_SELECTION_MODE_QUERY_PARAM_BY_KEY.damageType) ??
    DEFAULT_SPELL_FILTERS.selectionModeByKey.damageType;
  const schoolSelectionModeCandidate =
    searchParams.get(SPELL_SELECTION_MODE_QUERY_PARAM_BY_KEY.school) ??
    DEFAULT_SPELL_FILTERS.selectionModeByKey.school;
  const sourceSelectionModeCandidate =
    searchParams.get(SPELL_SELECTION_MODE_QUERY_PARAM_BY_KEY.source) ??
    DEFAULT_SPELL_FILTERS.selectionModeByKey.source;
  const attackTypeMatchModeCandidate =
    searchParams.get(SPELL_GROUP_MATCH_QUERY_PARAM_BY_KEY.attackType) ??
    DEFAULT_SPELL_FILTERS.groupMatchModeByKey.attackType;
  const classesMatchModeCandidate =
    searchParams.get(SPELL_GROUP_MATCH_QUERY_PARAM_BY_KEY.classes) ??
    DEFAULT_SPELL_FILTERS.groupMatchModeByKey.classes;
  const componentMatchModeCandidate =
    searchParams.get(SPELL_GROUP_MATCH_QUERY_PARAM_BY_KEY.component) ??
    DEFAULT_SPELL_FILTERS.groupMatchModeByKey.component;
  const saveAbilityMatchModeCandidate =
    searchParams.get(SPELL_GROUP_MATCH_QUERY_PARAM_BY_KEY.saveAbility) ??
    DEFAULT_SPELL_FILTERS.groupMatchModeByKey.saveAbility;
  const damageTypeMatchModeCandidate =
    searchParams.get(SPELL_GROUP_MATCH_QUERY_PARAM_BY_KEY.damageType) ??
    DEFAULT_SPELL_FILTERS.groupMatchModeByKey.damageType;
  const schoolMatchModeCandidate =
    searchParams.get(SPELL_GROUP_MATCH_QUERY_PARAM_BY_KEY.school) ??
    DEFAULT_SPELL_FILTERS.groupMatchModeByKey.school;
  const sourceMatchModeCandidate =
    searchParams.get(SPELL_GROUP_MATCH_QUERY_PARAM_BY_KEY.source) ??
    DEFAULT_SPELL_FILTERS.groupMatchModeByKey.source;

  const attackTypeSelectionMode = isSpellSelectionMode(
    attackTypeSelectionModeCandidate
  )
    ? attackTypeSelectionModeCandidate
    : DEFAULT_SELECTION_MODE;
  const classesSelectionMode = isSpellSelectionMode(
    classesSelectionModeCandidate
  )
    ? classesSelectionModeCandidate
    : DEFAULT_SELECTION_MODE;
  const componentSelectionMode = isSpellSelectionMode(
    componentSelectionModeCandidate
  )
    ? componentSelectionModeCandidate
    : DEFAULT_SELECTION_MODE;
  const saveAbilitySelectionMode = isSpellSelectionMode(
    saveAbilitySelectionModeCandidate
  )
    ? saveAbilitySelectionModeCandidate
    : DEFAULT_SELECTION_MODE;
  const damageTypeSelectionMode = isSpellSelectionMode(
    damageTypeSelectionModeCandidate
  )
    ? damageTypeSelectionModeCandidate
    : DEFAULT_SELECTION_MODE;
  const schoolSelectionMode = isSpellSelectionMode(schoolSelectionModeCandidate)
    ? schoolSelectionModeCandidate
    : DEFAULT_SELECTION_MODE;
  const sourceSelectionMode = isSpellSelectionMode(sourceSelectionModeCandidate)
    ? sourceSelectionModeCandidate
    : DEFAULT_SELECTION_MODE;
  const attackType = [
    ...new Set(
      attackTypeCandidate
        .map((value) => value.trim().toLowerCase())
        .filter((value): value is SpellAttackTypeFilter =>
          isSpellAttackTypeFilter(value)
        )
    ),
  ];
  const classes = [
    ...new Set(
      (classesCandidate.length
        ? classesCandidate
        : legacyFilter?.key === "classes"
          ? [legacyFilter.value]
          : []
      ).filter((value) => value !== ALL_FILTER_VALUE)
    ),
  ];
  const components = [
    ...new Set(
      componentCandidate.filter((value) => isSpellComponentFilter(value))
    ),
  ];
  const saveAbility = [
    ...new Set(
      saveAbilityCandidate
        .map((value) => value.trim().toLowerCase())
        .filter((value) => isSpellSaveAbilityFilter(value))
    ),
  ];
  const damageType = [
    ...new Set(
      damageTypeCandidate
        .map((value) => normalizeSpellDamageTypeFilterValue(value))
        .filter((value): value is SpellDamageTypeFilter => value !== null)
    ),
  ];
  const school = [
    ...new Set(
      schoolCandidate
        .map((value) => value.trim().toLowerCase())
        .filter((value): value is SpellSchoolFilter =>
          isSpellSchoolFilter(value)
        )
    ),
  ];
  const source = [
    ...new Set(
      sourceCandidate
        .map((value) => value.trim())
        .filter((value) => value && value !== ALL_FILTER_VALUE)
    ),
  ];

  return {
    attackType:
      attackTypeSelectionMode === "single"
        ? attackType.slice(0, 1)
        : attackType,
    castingTime:
      castingTime && castingTime !== ALL_FILTER_VALUE
        ? normalizeSpellCastingTimeForFilter(castingTime)
        : ALL_FILTER_VALUE,
    classData: isSpellClassDataFilter(classData)
      ? classData
      : DEFAULT_SPELL_FILTERS.classData,
    classes: classesSelectionMode === "single" ? classes.slice(0, 1) : classes,
    component:
      componentSelectionMode === "single" ? components.slice(0, 1) : components,
    concentration: isSpellBooleanFilter(concentrationCandidate)
      ? concentrationCandidate
      : DEFAULT_SPELL_FILTERS.concentration,
    damageType:
      damageTypeSelectionMode === "single"
        ? damageType.slice(0, 1)
        : damageType,
    duration:
      duration && duration !== ALL_FILTER_VALUE
        ? normalizeSpellDurationForFilter(duration)
        : ALL_FILTER_VALUE,
    groupMatchMode: isSpellMatchMode(groupMatchModeCandidate)
      ? groupMatchModeCandidate
      : DEFAULT_SPELL_FILTERS.groupMatchMode,
    groupMatchModeByKey: {
      attackType: isSpellMatchMode(attackTypeMatchModeCandidate)
        ? attackTypeMatchModeCandidate
        : DEFAULT_SPELL_FILTERS.groupMatchModeByKey.attackType,
      classes: isSpellMatchMode(classesMatchModeCandidate)
        ? classesMatchModeCandidate
        : DEFAULT_SPELL_FILTERS.groupMatchModeByKey.classes,
      component: isSpellMatchMode(componentMatchModeCandidate)
        ? componentMatchModeCandidate
        : DEFAULT_SPELL_FILTERS.groupMatchModeByKey.component,
      damageType: isSpellMatchMode(damageTypeMatchModeCandidate)
        ? damageTypeMatchModeCandidate
        : DEFAULT_SPELL_FILTERS.groupMatchModeByKey.damageType,
      source: isSpellMatchMode(sourceMatchModeCandidate)
        ? sourceMatchModeCandidate
        : DEFAULT_SPELL_FILTERS.groupMatchModeByKey.source,
      school: isSpellMatchMode(schoolMatchModeCandidate)
        ? schoolMatchModeCandidate
        : DEFAULT_SPELL_FILTERS.groupMatchModeByKey.school,
      saveAbility: isSpellMatchMode(saveAbilityMatchModeCandidate)
        ? saveAbilityMatchModeCandidate
        : DEFAULT_SPELL_FILTERS.groupMatchModeByKey.saveAbility,
    },
    higherLevel: isSpellBooleanFilter(higherLevelCandidate)
      ? higherLevelCandidate
      : DEFAULT_SPELL_FILTERS.higherLevel,
    level: isSpellLevelFilter(levelCandidate)
      ? levelCandidate
      : DEFAULT_SPELL_FILTERS.level,
    query: query.trim(),
    range:
      range && range !== ALL_FILTER_VALUE
        ? normalizeSpellRangeForFilter(range)
        : ALL_FILTER_VALUE,
    ritual: isSpellBooleanFilter(ritualCandidate)
      ? ritualCandidate
      : DEFAULT_SPELL_FILTERS.ritual,
    school: schoolSelectionMode === "single" ? school.slice(0, 1) : school,
    saveAbility:
      saveAbilitySelectionMode === "single"
        ? saveAbility.slice(0, 1)
        : saveAbility,
    selectionModeByKey: {
      attackType: attackTypeSelectionMode,
      classes: classesSelectionMode,
      component: componentSelectionMode,
      damageType: damageTypeSelectionMode,
      source: sourceSelectionMode,
      school: schoolSelectionMode,
      saveAbility: saveAbilitySelectionMode,
    },
    source: sourceSelectionMode === "single" ? source.slice(0, 1) : source,
  };
}

export function useSpellFilters(
  spells: Spell[],
  searchParams: SearchParamsInput
) {
  const filters = useMemo(
    () => parseSpellFilters(searchParams),
    [searchParams]
  );
  const filteredSpells = useMemo(
    () => filterSpells(spells, filters),
    [filters, spells]
  );

  return {
    filteredSpells,
    filters,
  };
}
