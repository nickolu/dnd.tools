"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import { FilterGroup } from "@/components/filter-group";
import { FilterLogicPopover } from "@/components/filter-logic-popover";
import { useMonsters } from "@/lib/query/hooks/useMonsters";
import {
  MonsterCard,
  MonsterRangeFilters,
  MonsterResultsSummary,
} from "@/page/monsters/components";
import {
  ALL_FILTER_VALUE,
  MONSTER_FILTER_GROUP_LABEL_BY_KEY,
  MONSTER_FILTER_QUERY_PARAM_BY_KEY,
  MONSTER_GROUP_MATCH_QUERY_PARAM,
  MONSTER_GROUP_MATCH_QUERY_PARAM_BY_KEY,
  MONSTER_RANGE_QUERY_PARAM_BY_KEY,
  MONSTER_SELECTION_MODE_QUERY_PARAM_BY_KEY,
  MONSTER_SIZE_VALUES,
} from "@/page/monsters/constants";
import { useMonsterFilters } from "@/page/monsters/hooks/useMonsterFilters";
import type {
  MonsterFilterGroup as MonsterFilterGroupType,
  MonsterFilterGroupKey,
  MonsterMatchMode,
  MonsterMultiSelectableGroupKey,
  MonsterRangeFilterKey,
  MonsterSelectionMode,
} from "@/page/monsters/types";
import { getMonsterFilterGroups } from "@/page/monsters/utils/getMonsterFilterGroups";
import { getMonsterRangeFilterGroups } from "@/page/monsters/utils/getMonsterRangeFilterGroups";
import { formatChallengeRating } from "@/page/monsters/utils/monster-filter-values";

const MULTI_SELECTABLE_GROUPS: MonsterMultiSelectableGroupKey[] = [
  "size",
  "type",
  "alignmentLaw",
  "alignmentMoral",
  "source",
  "senses",
  "damageResistances",
  "damageImmunities",
  "damageVulnerabilities",
  "conditionImmunities",
];

function isMultiSelectableGroupKey(
  key: MonsterFilterGroupKey
): key is MonsterMultiSelectableGroupKey {
  return MULTI_SELECTABLE_GROUPS.includes(key);
}

function getHomeIntentFilterGroupKey(searchParams: {
  get: (key: string) => string | null;
}): MonsterFilterGroupKey | null {
  if (searchParams.get("intent") !== "filter") {
    return null;
  }

  const raw = searchParams.get("filter")?.trim();
  if (!raw) {
    return null;
  }

  const [key] = raw.split(":");
  if (
    key === "size" ||
    key === "type" ||
    key === "alignmentLaw" ||
    key === "alignmentMoral" ||
    key === "source" ||
    key === "senses" ||
    key === "damageResistances" ||
    key === "damageImmunities" ||
    key === "damageVulnerabilities" ||
    key === "conditionImmunities"
  ) {
    return key;
  }

  if (MONSTER_SIZE_VALUES.some((size) => size === raw)) {
    return "size";
  }

  return null;
}

export default function MonstersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const { data: monsters = [], isLoading } = useMonsters();
  const { filteredMonsters, filters } = useMonsterFilters(
    monsters,
    searchParams
  );
  const filterGroups = useMemo<MonsterFilterGroupType[]>(
    () => getMonsterFilterGroups(monsters),
    [monsters]
  );
  const rangeFilterGroups = useMemo(
    () => getMonsterRangeFilterGroups(monsters),
    [monsters]
  );
  const homeIntentFilterGroupKey = getHomeIntentFilterGroupKey(searchParams);

  useEffect(() => {
    if (searchParams.get("intent") !== "search") {
      return;
    }

    searchRef.current?.focus();
    searchRef.current?.select();
  }, [searchParams]);

  const updateSearchParam = (queryParam: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(queryParam, value);
    } else {
      params.delete(queryParam);
    }

    params.delete("intent");
    params.delete("filter");
    router.push(
      `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
    );
  };

  const updateMultiSearchParam = (queryParam: string, values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(queryParam);

    values
      .filter((value) => value !== ALL_FILTER_VALUE)
      .forEach((value) => params.append(queryParam, value));

    params.delete("intent");
    params.delete("filter");
    router.push(
      `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
    );
  };

  const updateRangeSearchParam = (
    key: MonsterRangeFilterKey,
    bound: "min" | "max",
    value: number | null
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    const queryParam = MONSTER_RANGE_QUERY_PARAM_BY_KEY[key][bound];

    if (value === null) {
      params.delete(queryParam);
    } else {
      params.set(queryParam, String(value));
    }

    const parseParamNumber = (rawValue: string | null): number | null => {
      if (!rawValue) {
        return null;
      }

      const parsed = Number(rawValue);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const currentMin =
      bound === "min"
        ? value
        : parseParamNumber(
            params.get(MONSTER_RANGE_QUERY_PARAM_BY_KEY[key].min)
          );
    const currentMax =
      bound === "max"
        ? value
        : parseParamNumber(
            params.get(MONSTER_RANGE_QUERY_PARAM_BY_KEY[key].max)
          );

    if (currentMin !== null && currentMax !== null && currentMin > currentMax) {
      params.set(MONSTER_RANGE_QUERY_PARAM_BY_KEY[key].min, String(currentMax));
      params.set(MONSTER_RANGE_QUERY_PARAM_BY_KEY[key].max, String(currentMin));
    }

    params.delete("intent");
    params.delete("filter");
    router.push(
      `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
    );
  };

  const updateGlobalMatchMode = (mode: MonsterMatchMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (mode === "and") {
      params.delete(MONSTER_GROUP_MATCH_QUERY_PARAM);
    } else {
      params.set(MONSTER_GROUP_MATCH_QUERY_PARAM, mode);
    }

    params.delete("intent");
    params.delete("filter");
    router.push(
      `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
    );
  };

  const updateSelectionMode = (
    key: MonsterMultiSelectableGroupKey,
    mode: MonsterSelectionMode
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    const selectionParam = MONSTER_SELECTION_MODE_QUERY_PARAM_BY_KEY[key];
    if (mode === "single") {
      params.delete(selectionParam);
    } else {
      params.set(selectionParam, mode);
    }

    if (mode === "single") {
      const filterParam = MONSTER_FILTER_QUERY_PARAM_BY_KEY[key];
      const selected = params.getAll(filterParam).filter(Boolean);
      if (selected.length > 1) {
        params.delete(filterParam);
        params.append(filterParam, selected[0] ?? "");
      }
    }

    params.delete("intent");
    params.delete("filter");
    router.push(
      `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
    );
  };

  const updateGroupMatchModeByKey = (
    key: MonsterMultiSelectableGroupKey,
    mode: MonsterMatchMode
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    const matchParam = MONSTER_GROUP_MATCH_QUERY_PARAM_BY_KEY[key];
    if (mode === "or") {
      params.delete(matchParam);
    } else {
      params.set(matchParam, mode);
    }

    params.delete("intent");
    params.delete("filter");
    router.push(
      `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
    );
  };

  const getActiveValues = (key: MonsterFilterGroupKey): string[] => {
    const selected = filters[key];
    return selected.length ? selected : [ALL_FILTER_VALUE];
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <section className="surface-card p-6">
        <h1 className="typography-h1">Monsters</h1>
        <MonsterResultsSummary
          total={monsters.length}
          visible={filteredMonsters.length}
        />

        <div className="mt-4 space-y-3">
          <div className="relative">
            <div className="flex items-center gap-2">
              <input
                className="input-field w-full px-3 py-2"
                onChange={(event) => {
                  updateSearchParam("q", event.target.value);
                }}
                placeholder="Search monsters"
                ref={searchRef}
                value={filters.query}
              />
              <FilterLogicPopover
                globalMatchMode={filters.groupMatchMode}
                groups={MULTI_SELECTABLE_GROUPS.map((key) => ({
                  key,
                  label: MONSTER_FILTER_GROUP_LABEL_BY_KEY[key],
                  matchMode: filters.groupMatchModeByKey[key],
                  onMatchModeChange: (mode) => {
                    updateGroupMatchModeByKey(key, mode);
                  },
                  onSelectionModeChange: (mode) => {
                    updateSelectionMode(key, mode);
                  },
                  selectionMode: filters.selectionModeByKey[key],
                }))}
                onGlobalMatchModeChange={updateGlobalMatchMode}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {filterGroups.map((group) => (
              <FilterGroup
                activeValues={getActiveValues(group.key)}
                className="mr-2"
                key={group.key}
                label={group.label}
                onChange={(values) => {
                  const queryParam =
                    MONSTER_FILTER_QUERY_PARAM_BY_KEY[group.key];
                  if (isMultiSelectableGroupKey(group.key)) {
                    updateMultiSearchParam(queryParam, values);
                    return;
                  }

                  const nextValue = values[0] ?? ALL_FILTER_VALUE;
                  updateSearchParam(
                    queryParam,
                    nextValue === ALL_FILTER_VALUE ? "" : nextValue
                  );
                }}
                options={group.options}
                selectionMode={
                  isMultiSelectableGroupKey(group.key)
                    ? filters.selectionModeByKey[group.key]
                    : "single"
                }
                shouldExpand={homeIntentFilterGroupKey === group.key}
                storageKey={`monsters:${group.key}`}
              />
            ))}
          </div>
          <MonsterRangeFilters
            formatValue={(key, value) =>
              key === "crNumeric" ? formatChallengeRating(value) : String(value)
            }
            items={rangeFilterGroups.map((group) => ({
              key: group.key,
              label: group.label,
              max: filters.rangeByKey[group.key].max,
              min: filters.rangeByKey[group.key].min,
              onMaxChange: (value) => {
                updateRangeSearchParam(group.key, "max", value);
              },
              onMinChange: (value) => {
                updateRangeSearchParam(group.key, "min", value);
              },
              options: group.options,
            }))}
          />
        </div>

        {isLoading ? (
          <p className="typography-body-sm text-muted mt-4">
            Loading monsters...
          </p>
        ) : null}
        {!isLoading && !filteredMonsters.length ? (
          <p className="typography-body-sm text-muted mt-4">
            No monsters match your filters.
          </p>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {filteredMonsters.map((monster) => (
            <MonsterCard key={monster.id} monster={monster} />
          ))}
        </div>
      </section>
    </main>
  );
}
