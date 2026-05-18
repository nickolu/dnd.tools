"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { CopyVisibleNamesAction } from "@/components/copy-visible-names-action";
import { FilterGroup } from "@/components/filter-group";
import { FilterLogicPopover } from "@/components/filter-logic-popover";
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";
import {
  clearCollectionCache,
  getCollectionLastSyncedAt,
  getReadableFetchError,
} from "@/lib/api/client";
import { useMonsters } from "@/lib/query/hooks/useMonsters";
import { useSavedMonsterListStore } from "@/lib/store/useSavedMonsterListStore";
import {
  applyPersistedFilterQueryParams,
  clearFilterQueryParams,
  hasAnyFilterQueryParam,
  persistFilterQueryParams,
  readPersistedFilterQueryParams,
} from "@/lib/util/filter-query-persistence";
import {
  MonsterCard,
  MonsterListSelector,
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

const MONSTER_FILTER_STORAGE_KEY = "dnd.tools:monsters:filters";
const SEARCH_DEBOUNCE_MS = 400;

const MONSTER_PERSISTED_QUERY_KEYS = [
  "q",
  ...Object.values(MONSTER_FILTER_QUERY_PARAM_BY_KEY),
  MONSTER_GROUP_MATCH_QUERY_PARAM,
  ...Object.values(MONSTER_GROUP_MATCH_QUERY_PARAM_BY_KEY),
  ...Object.values(MONSTER_SELECTION_MODE_QUERY_PARAM_BY_KEY),
  ...Object.values(MONSTER_RANGE_QUERY_PARAM_BY_KEY).flatMap((params) => [
    params.min,
    params.max,
  ]),
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

function MonstersPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasHydratedPersistedFiltersRef = useRef(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchDebounceTimeoutRef = useRef<number | null>(null);
  const {
    data: monsters = [],
    error,
    isError,
    isLoading,
    refetch,
  } = useMonsters();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const isAdminMode = searchParams.get("admin") === "true";

  // Saved monster list state
  const lists = useSavedMonsterListStore((s) => s.lists);
  const listIdParam = searchParams.get("list");
  const activeList = useMemo(
    () =>
      listIdParam ? (lists.find((l) => l.id === listIdParam) ?? null) : null,
    [listIdParam, lists]
  );

  // Pre-filter monsters to active list scope before applying other filters
  const monstersInScope = useMemo(() => {
    if (!activeList) return monsters;
    const idSet = new Set(activeList.monsterIds);
    return monsters.filter((monster) => idSet.has(monster.id));
  }, [monsters, activeList]);

  const { filteredMonsters, filters } = useMonsterFilters(
    monstersInScope,
    searchParams
  );
  const [searchInput, setSearchInput] = useState(filters.query);
  const filterGroups = useMemo<MonsterFilterGroupType[]>(
    () => getMonsterFilterGroups(monsters),
    [monsters]
  );
  const rangeFilterGroups = useMemo(
    () => getMonsterRangeFilterGroups(monsters),
    [monsters]
  );
  const homeIntentFilterGroupKey = getHomeIntentFilterGroupKey(searchParams);

  // Strip stale ?list=<id> if the list no longer exists
  useEffect(() => {
    if (listIdParam && !activeList) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("list");
      router.replace(
        `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
      );
    }
  }, [listIdParam, activeList, pathname, router, searchParams]);

  useEffect(() => {
    if (searchParams.get("intent") !== "search") {
      return;
    }

    searchRef.current?.focus();
    searchRef.current?.select();
  }, [searchParams]);

  // Handle intent=list from home page navigation: just clean up the intent param
  useEffect(() => {
    if (searchParams.get("intent") !== "list") {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("intent");
    router.replace(
      `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
    );
  }, [searchParams, pathname, router]);

  useEffect(() => {
    if (hasHydratedPersistedFiltersRef.current) {
      return;
    }
    hasHydratedPersistedFiltersRef.current = true;

    const currentParams = new URLSearchParams(searchParams.toString());
    if (
      currentParams.has("intent") ||
      currentParams.has("filter") ||
      hasAnyFilterQueryParam(searchParams, MONSTER_PERSISTED_QUERY_KEYS)
    ) {
      return;
    }

    const persistedParams = readPersistedFilterQueryParams(
      MONSTER_FILTER_STORAGE_KEY
    );
    if (!persistedParams) {
      return;
    }

    const nextParams = applyPersistedFilterQueryParams(
      currentParams,
      persistedParams,
      MONSTER_PERSISTED_QUERY_KEYS
    );
    if (nextParams.toString() === currentParams.toString()) {
      return;
    }

    router.replace(
      `${pathname}${nextParams.toString() ? `?${nextParams.toString()}` : ""}`
    );
  }, [pathname, router, searchParams]);

  useEffect(() => {
    persistFilterQueryParams(
      MONSTER_FILTER_STORAGE_KEY,
      searchParams,
      MONSTER_PERSISTED_QUERY_KEYS
    );
  }, [searchParams]);

  useEffect(() => {
    if (searchDebounceTimeoutRef.current !== null) {
      return;
    }

    setSearchInput(filters.query);
  }, [filters.query]);

  useEffect(() => {
    if (searchInput === filters.query) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      searchDebounceTimeoutRef.current = null;

      const params = new URLSearchParams(searchParams.toString());
      const currentQuery = params.get("q") ?? "";
      if (currentQuery === searchInput) {
        return;
      }

      if (searchInput) {
        params.set("q", searchInput);
      } else {
        params.delete("q");
      }

      params.delete("intent");
      params.delete("filter");
      router.replace(
        `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
      );
    }, SEARCH_DEBOUNCE_MS);
    searchDebounceTimeoutRef.current = timeoutId;

    return () => {
      if (searchDebounceTimeoutRef.current !== null) {
        window.clearTimeout(searchDebounceTimeoutRef.current);
        searchDebounceTimeoutRef.current = null;
      }
    };
  }, [filters.query, pathname, router, searchInput, searchParams]);

  useEffect(() => {
    let isActive = true;

    void getCollectionLastSyncedAt("monsters").then((syncedAt) => {
      if (!isActive) {
        return;
      }

      setLastSyncedAt(syncedAt);
    });

    return () => {
      isActive = false;
    };
  }, [monsters.length]);

  const lastSyncedLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString()
    : "Not synced yet";

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

  const hasActiveFilters = hasAnyFilterQueryParam(
    searchParams,
    MONSTER_PERSISTED_QUERY_KEYS
  );

  const resetAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    clearFilterQueryParams(params, MONSTER_PERSISTED_QUERY_KEYS);
    params.delete("intent");
    params.delete("filter");
    window.localStorage.removeItem(MONSTER_FILTER_STORAGE_KEY);
    router.push(
      `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <section className="surface-card p-6">
        <h1 className="typography-h1">Monsters</h1>
        <MonsterResultsSummary
          {...(activeList
            ? {
                activeListName: activeList.name,
                activeListTotal: monstersInScope.length,
              }
            : {})}
          isLoading={isLoading}
          total={monsters.length}
          visible={filteredMonsters.length}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="typography-body-sm text-muted">
            Last synced: {lastSyncedLabel}
          </p>
          <div className="flex items-center gap-2">
            <CopyVisibleNamesAction
              disabled={isLoading || isError}
              itemTypeLabel="monster"
              names={filteredMonsters.map((monster) => monster.name)}
            />
            <button
              className="admin-button-secondary typography-body-sm px-3 py-1"
              disabled={isRefreshing}
              onClick={async () => {
                setIsRefreshing(true);

                try {
                  await clearCollectionCache("monsters");
                  await refetch();
                  const syncedAt = await getCollectionLastSyncedAt("monsters");
                  setLastSyncedAt(syncedAt);
                } finally {
                  setIsRefreshing(false);
                }
              }}
              type="button"
            >
              {isRefreshing ? "Refreshing..." : "Refresh data"}
            </button>
          </div>
        </div>

        {isError ? (
          <div className="surface-card mt-3 flex items-center gap-3 p-3">
            <p className="typography-body-sm text-secondary">
              {getReadableFetchError(error, "monsters")}
            </p>
            <button
              className="admin-button-secondary typography-body-sm px-3 py-1"
              disabled={isRetrying}
              onClick={async () => {
                setIsRetrying(true);
                try {
                  await refetch();
                } finally {
                  setIsRetrying(false);
                }
              }}
              type="button"
            >
              {isRetrying ? "Retrying…" : "Retry"}
            </button>
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          <div className="relative">
            <div className="flex items-center gap-2">
              <MonsterListSelector
                activeListId={activeList?.id ?? null}
                onListSelect={(listId) => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (listId) {
                    params.set("list", listId);
                  } else {
                    params.delete("list");
                  }
                  params.delete("intent");
                  params.delete("filter");
                  router.push(
                    `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
                  );
                }}
              />
              <input
                className="input-field w-full px-3 py-2"
                onChange={(event) => {
                  setSearchInput(event.target.value);
                }}
                placeholder="Search monsters"
                ref={searchRef}
                value={searchInput}
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
              <button
                className="admin-button-secondary typography-body-sm whitespace-nowrap px-3 py-2"
                disabled={!hasActiveFilters}
                onClick={resetAllFilters}
                type="button"
              >
                Reset filters
              </button>
            </div>
          </div>

          <div className="flex flex-wrap">
            {filterGroups.map((group) => (
              <FilterGroup
                activeValues={getActiveValues(group.key)}
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
        {!isLoading && !isError && !filteredMonsters.length ? (
          <div className="mt-4 flex flex-col items-start gap-2">
            <p className="typography-body-sm text-muted">
              No monsters match your filters.
            </p>
            {hasActiveFilters ? (
              <button
                className="admin-button-secondary typography-body-sm px-3 py-1"
                onClick={resetAllFilters}
              >
                Clear all filters
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {filteredMonsters.map((monster) => (
            <MonsterCard
              detailHref={`/monsters/${encodeURIComponent(monster.id)}`}
              isAdminMode={isAdminMode}
              key={monster.id}
              onMonsterUpdated={async () => {
                const syncedAt = await getCollectionLastSyncedAt("monsters");
                setLastSyncedAt(syncedAt);
              }}
              monster={monster}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default function MonstersPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <MonstersPageContent />
    </Suspense>
  );
}
