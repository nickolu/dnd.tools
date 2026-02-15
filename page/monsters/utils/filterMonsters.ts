import type { Monster } from "@/lib/domain/monster.schema";
import {
  MONSTER_FILTER_GROUP_KEYS,
  MONSTER_RANGE_FILTER_KEYS,
} from "@/page/monsters/constants";
import type {
  MonsterFilters,
  MonsterRangeFilterKey,
} from "@/page/monsters/types";
import {
  getGroupValuesByKey,
  getMonsterNumericValue,
} from "@/page/monsters/utils/monster-filter-values";

function hasActiveMonsterFilters(filters: MonsterFilters): boolean {
  return (
    Boolean(filters.query.trim()) ||
    filters.size.length > 0 ||
    filters.type.length > 0 ||
    filters.alignmentLaw.length > 0 ||
    filters.alignmentMoral.length > 0 ||
    filters.source.length > 0 ||
    filters.senses.length > 0 ||
    filters.damageResistances.length > 0 ||
    filters.damageImmunities.length > 0 ||
    filters.damageVulnerabilities.length > 0 ||
    filters.conditionImmunities.length > 0 ||
    Object.values(filters.rangeByKey).some(
      (range) => range.min !== null || range.max !== null
    )
  );
}

function matchesGroup(
  selected: string[],
  values: string[],
  mode: "and" | "or"
): boolean {
  if (!selected.length) {
    return true;
  }

  if (!values.length) {
    return false;
  }

  return mode === "and"
    ? selected.every((value) => values.includes(value))
    : selected.some((value) => values.includes(value));
}

function inRange(
  value: number | null,
  min: number | null,
  max: number | null
): boolean {
  if (value === null) {
    return false;
  }

  if (min !== null && value < min) {
    return false;
  }

  if (max !== null && value > max) {
    return false;
  }

  return true;
}

function matchesRange(
  monster: Monster,
  key: MonsterRangeFilterKey,
  filters: MonsterFilters
): boolean {
  const range = filters.rangeByKey[key];
  if (range.min === null && range.max === null) {
    return true;
  }

  return inRange(getMonsterNumericValue(monster, key), range.min, range.max);
}

export function filterMonsters(
  monsters: Monster[],
  filters: MonsterFilters
): Monster[] {
  if (!hasActiveMonsterFilters(filters)) {
    return monsters;
  }

  const query = filters.query.trim().toLowerCase();

  return monsters.filter((monster) => {
    const checks: boolean[] = [];

    if (query) {
      checks.push(monster.nameNormalized.includes(query));
    }

    MONSTER_FILTER_GROUP_KEYS.forEach((key) => {
      const selected = filters[key];
      if (!selected.length) {
        return;
      }

      checks.push(
        matchesGroup(
          selected,
          getGroupValuesByKey(monster, key),
          filters.groupMatchModeByKey[key]
        )
      );
    });

    MONSTER_RANGE_FILTER_KEYS.forEach((key) => {
      const range = filters.rangeByKey[key];
      if (range.min === null && range.max === null) {
        return;
      }

      checks.push(matchesRange(monster, key, filters));
    });

    if (!checks.length) {
      return true;
    }

    return filters.groupMatchMode === "or"
      ? checks.some(Boolean)
      : checks.every(Boolean);
  });
}
