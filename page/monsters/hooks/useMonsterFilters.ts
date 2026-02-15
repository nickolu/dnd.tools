import type { ReadonlyURLSearchParams } from "next/navigation";
import { useMemo } from "react";

import type { Monster } from "@/lib/domain/monster.schema";
import {
  DEFAULT_MONSTER_FILTERS,
  MONSTER_SIZE_FILTERS,
} from "@/page/monsters/constants";
import type { MonsterFilters } from "@/page/monsters/types";
import { filterMonsters } from "@/page/monsters/utils/filterMonsters";

type SearchParamsInput = URLSearchParams | ReadonlyURLSearchParams;

function isMonsterSizeFilter(value: string): value is MonsterFilters["size"] {
  return MONSTER_SIZE_FILTERS.some((size) => size === value);
}

function parseMonsterFilters(searchParams: SearchParamsInput): MonsterFilters {
  const query = searchParams.get("q")?.trim() ?? "";
  const sizeCandidate =
    searchParams.get("size") ?? searchParams.get("filter") ?? "all";
  const size = isMonsterSizeFilter(sizeCandidate)
    ? sizeCandidate
    : DEFAULT_MONSTER_FILTERS.size;

  return {
    query,
    size,
  };
}

export function useMonsterFilters(
  monsters: Monster[],
  searchParams: SearchParamsInput
) {
  const filters = useMemo(() => parseMonsterFilters(searchParams), [searchParams]);
  const filteredMonsters = useMemo(
    () => filterMonsters(monsters, filters),
    [filters, monsters]
  );

  return {
    filteredMonsters,
    filters,
  };
}
