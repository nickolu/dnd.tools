import type { Monster } from "@/lib/domain/monster.schema";
import { MONSTER_RANGE_FILTER_GROUPS } from "@/page/monsters/constants";
import type { MonsterRangeFilterGroup } from "@/page/monsters/types";
import { getMonsterNumericValue } from "@/page/monsters/utils/monster-filter-values";

function getSortedUniqueNumericValues(values: Array<number | null>): number[] {
  return [
    ...new Set(values.filter((value): value is number => value !== null)),
  ].sort((a, b) => a - b);
}

export function getMonsterRangeFilterGroups(
  monsters: Monster[]
): MonsterRangeFilterGroup[] {
  return MONSTER_RANGE_FILTER_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    options: getSortedUniqueNumericValues(
      monsters.map((monster) => getMonsterNumericValue(monster, group.key))
    ),
  }));
}
