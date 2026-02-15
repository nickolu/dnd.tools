import type { ReadonlyURLSearchParams } from "next/navigation";
import { useMemo } from "react";

import type { Monster } from "@/lib/domain/monster.schema";
import {
  ALL_FILTER_VALUE,
  DEFAULT_MONSTER_FILTERS,
  DEFAULT_SELECTION_MODE,
  isMonsterMatchMode,
  isMonsterSelectionMode,
  isMonsterSizeFilter,
  MONSTER_FILTER_QUERY_PARAM_BY_KEY,
  MONSTER_GROUP_MATCH_QUERY_PARAM,
  MONSTER_GROUP_MATCH_QUERY_PARAM_BY_KEY,
  MONSTER_RANGE_QUERY_PARAM_BY_KEY,
  MONSTER_SELECTION_MODE_QUERY_PARAM_BY_KEY,
} from "@/page/monsters/constants";
import type {
  MonsterFilterGroupKey,
  MonsterFilters,
  MonsterRangeFilter,
  MonsterRangeFilterKey,
} from "@/page/monsters/types";
import { filterMonsters } from "@/page/monsters/utils/filterMonsters";
import {
  getAlignmentLawValuesFromText,
  getAlignmentMoralValuesFromText,
} from "@/page/monsters/utils/monster-filter-values";

type SearchParamsInput = URLSearchParams | ReadonlyURLSearchParams;

function parseValues(
  searchParams: SearchParamsInput,
  queryParam: string
): string[] {
  return [...new Set(searchParams.getAll(queryParam).filter(Boolean))].filter(
    (value) => value !== ALL_FILTER_VALUE
  );
}

function parseNumberParam(
  searchParams: SearchParamsInput,
  queryParam: string
): number | null {
  const candidate = searchParams.get(queryParam);
  if (!candidate) {
    return null;
  }

  const parsed = Number(candidate);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRange(
  searchParams: SearchParamsInput,
  key: MonsterRangeFilterKey
): MonsterRangeFilter {
  const params = MONSTER_RANGE_QUERY_PARAM_BY_KEY[key];
  const min = parseNumberParam(searchParams, params.min);
  const max = parseNumberParam(searchParams, params.max);

  if (min !== null && max !== null && min > max) {
    return { max: min, min: max };
  }

  return { max, min };
}

function parseGroup(
  searchParams: SearchParamsInput,
  key: MonsterFilterGroupKey
): {
  matchMode: "and" | "or";
  selectionMode: "single" | "multi";
  values: string[];
} {
  const queryParam = MONSTER_FILTER_QUERY_PARAM_BY_KEY[key];
  const selectionModeCandidate =
    searchParams.get(MONSTER_SELECTION_MODE_QUERY_PARAM_BY_KEY[key]) ??
    DEFAULT_MONSTER_FILTERS.selectionModeByKey[key];
  const matchModeCandidate =
    searchParams.get(MONSTER_GROUP_MATCH_QUERY_PARAM_BY_KEY[key]) ??
    DEFAULT_MONSTER_FILTERS.groupMatchModeByKey[key];

  const selectionMode = isMonsterSelectionMode(selectionModeCandidate)
    ? selectionModeCandidate
    : DEFAULT_SELECTION_MODE;
  const matchMode = isMonsterMatchMode(matchModeCandidate)
    ? matchModeCandidate
    : DEFAULT_MONSTER_FILTERS.groupMatchModeByKey[key];

  const values = parseValues(searchParams, queryParam);
  const normalizedValues =
    key === "senses"
      ? values.map((value) => value.trim().toLowerCase())
      : values;

  return {
    matchMode,
    selectionMode,
    values:
      selectionMode === "single"
        ? normalizedValues.slice(0, 1)
        : normalizedValues,
  };
}

function parseLegacyAlignmentValues(searchParams: SearchParamsInput): {
  law: string[];
  moral: string[];
} {
  const legacy = parseValues(searchParams, "alignment");

  const law = [
    ...new Set(legacy.flatMap((value) => getAlignmentLawValuesFromText(value))),
  ];
  const moral = [
    ...new Set(
      legacy.flatMap((value) => getAlignmentMoralValuesFromText(value))
    ),
  ];

  return { law, moral };
}

function parseMonsterFilters(searchParams: SearchParamsInput): MonsterFilters {
  const query = searchParams.get("q")?.trim() ?? DEFAULT_MONSTER_FILTERS.query;
  const groupMatchModeCandidate =
    searchParams.get(MONSTER_GROUP_MATCH_QUERY_PARAM) ??
    DEFAULT_MONSTER_FILTERS.groupMatchMode;

  const sizeGroup = parseGroup(searchParams, "size");
  const typeGroup = parseGroup(searchParams, "type");
  const alignmentLawGroup = parseGroup(searchParams, "alignmentLaw");
  const alignmentMoralGroup = parseGroup(searchParams, "alignmentMoral");
  const sourceGroup = parseGroup(searchParams, "source");
  const sensesGroup = parseGroup(searchParams, "senses");
  const damageResistancesGroup = parseGroup(searchParams, "damageResistances");
  const damageImmunitiesGroup = parseGroup(searchParams, "damageImmunities");
  const damageVulnerabilitiesGroup = parseGroup(
    searchParams,
    "damageVulnerabilities"
  );
  const conditionImmunitiesGroup = parseGroup(
    searchParams,
    "conditionImmunities"
  );

  const legacySize = searchParams.get("filter");
  const sizeValues = [...sizeGroup.values];
  if (legacySize && isMonsterSizeFilter(legacySize) && !sizeValues.length) {
    sizeValues.push(legacySize);
  }

  const legacyAlignment = parseLegacyAlignmentValues(searchParams);
  const alignmentLawValues =
    alignmentLawGroup.values.length > 0
      ? alignmentLawGroup.values
      : legacyAlignment.law;
  const alignmentMoralValues =
    alignmentMoralGroup.values.length > 0
      ? alignmentMoralGroup.values
      : legacyAlignment.moral;

  return {
    alignmentLaw: alignmentLawValues,
    alignmentMoral: alignmentMoralValues,
    conditionImmunities: conditionImmunitiesGroup.values,
    damageImmunities: damageImmunitiesGroup.values,
    damageResistances: damageResistancesGroup.values,
    damageVulnerabilities: damageVulnerabilitiesGroup.values,
    groupMatchMode: isMonsterMatchMode(groupMatchModeCandidate)
      ? groupMatchModeCandidate
      : DEFAULT_MONSTER_FILTERS.groupMatchMode,
    groupMatchModeByKey: {
      alignmentLaw: alignmentLawGroup.matchMode,
      alignmentMoral: alignmentMoralGroup.matchMode,
      conditionImmunities: conditionImmunitiesGroup.matchMode,
      damageImmunities: damageImmunitiesGroup.matchMode,
      damageResistances: damageResistancesGroup.matchMode,
      damageVulnerabilities: damageVulnerabilitiesGroup.matchMode,
      senses: sensesGroup.matchMode,
      size: sizeGroup.matchMode,
      source: sourceGroup.matchMode,
      type: typeGroup.matchMode,
    },
    query,
    rangeByKey: {
      armorClass: parseRange(searchParams, "armorClass"),
      cha: parseRange(searchParams, "cha"),
      con: parseRange(searchParams, "con"),
      crNumeric: parseRange(searchParams, "crNumeric"),
      dex: parseRange(searchParams, "dex"),
      hitPoints: parseRange(searchParams, "hitPoints"),
      int: parseRange(searchParams, "int"),
      str: parseRange(searchParams, "str"),
      wis: parseRange(searchParams, "wis"),
    },
    selectionModeByKey: {
      alignmentLaw: alignmentLawGroup.selectionMode,
      alignmentMoral: alignmentMoralGroup.selectionMode,
      conditionImmunities: conditionImmunitiesGroup.selectionMode,
      damageImmunities: damageImmunitiesGroup.selectionMode,
      damageResistances: damageResistancesGroup.selectionMode,
      damageVulnerabilities: damageVulnerabilitiesGroup.selectionMode,
      senses: sensesGroup.selectionMode,
      size: sizeGroup.selectionMode,
      source: sourceGroup.selectionMode,
      type: typeGroup.selectionMode,
    },
    senses: sensesGroup.values,
    size: sizeValues.filter((value): value is Monster["size"] =>
      isMonsterSizeFilter(value)
    ),
    source: sourceGroup.values,
    type: typeGroup.values,
  };
}

export function useMonsterFilters(
  monsters: Monster[],
  searchParams: SearchParamsInput
) {
  const filters = useMemo(
    () => parseMonsterFilters(searchParams),
    [searchParams]
  );
  const filteredMonsters = useMemo(
    () => filterMonsters(monsters, filters),
    [filters, monsters]
  );

  return {
    filteredMonsters,
    filters,
  };
}
