"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { CopyVisibleNamesAction } from "@/components/copy-visible-names-action";
import { FilterGroup } from "@/components/filter-group";
import { FilterLogicPopover } from "@/components/filter-logic-popover";
import {
  clearCollectionCache,
  getCollectionLastSyncedAt,
  getReadableFetchError,
} from "@/lib/api/client";
import { useSpells } from "@/lib/query/hooks/useSpells";
import {
  applyPersistedFilterQueryParams,
  clearFilterQueryParams,
  hasAnyFilterQueryParam,
  persistFilterQueryParams,
  readPersistedFilterQueryParams,
} from "@/lib/util/filter-query-persistence";
import { SpellCard, SpellResultsSummary } from "@/page/spells/components";
import {
  ALL_FILTER_VALUE,
  SPELL_FILTER_QUERY_PARAM_BY_KEY,
  SPELL_GROUP_MATCH_QUERY_PARAM,
  SPELL_GROUP_MATCH_QUERY_PARAM_BY_KEY,
  SPELL_SELECTION_MODE_QUERY_PARAM_BY_KEY,
} from "@/page/spells/constants";
import { useSpellFilters } from "@/page/spells/hooks/useSpellFilters";
import type {
  SpellFilterGroup as SpellFilterGroupType,
  SpellFilterGroupKey,
  SpellMatchMode,
  SpellMultiSelectableGroupKey,
  SpellSelectionMode,
} from "@/page/spells/types";
import { getSpellFilterGroups } from "@/page/spells/utils/getSpellFilterGroups";

const MULTI_SELECTABLE_GROUPS: SpellMultiSelectableGroupKey[] = [
  "school",
  "attackType",
  "classes",
  "component",
  "saveAbility",
  "damageType",
  "source",
];

const SPELL_FILTER_GROUP_LABEL_BY_KEY: Record<
  SpellMultiSelectableGroupKey,
  string
> = {
  attackType: "Attack Type",
  classes: "Classes",
  component: "Components",
  damageType: "Damage Type",
  school: "School",
  saveAbility: "Save Ability",
  source: "Source",
};

const SPELL_FILTER_STORAGE_KEY = "dnd.tools:spells:filters";

const SPELL_PERSISTED_QUERY_KEYS = [
  "q",
  ...Object.values(SPELL_FILTER_QUERY_PARAM_BY_KEY),
  SPELL_GROUP_MATCH_QUERY_PARAM,
  ...Object.values(SPELL_GROUP_MATCH_QUERY_PARAM_BY_KEY),
  ...Object.values(SPELL_SELECTION_MODE_QUERY_PARAM_BY_KEY),
];

function isMultiSelectableGroupKey(
  key: SpellFilterGroupKey
): key is SpellMultiSelectableGroupKey {
  return (
    key === "school" ||
    key === "attackType" ||
    key === "classes" ||
    key === "component" ||
    key === "saveAbility" ||
    key === "damageType" ||
    key === "source"
  );
}

function getHomeIntentFilterGroupKey(searchParams: {
  get: (key: string) => string | null;
}): SpellFilterGroupKey | null {
  if (searchParams.get("intent") !== "filter") {
    return null;
  }

  const raw = searchParams.get("filter")?.trim();
  if (!raw) {
    return null;
  }

  const [key] = raw.split(":");
  if (
    key === "school" ||
    key === "attackType" ||
    key === "classes" ||
    key === "classData" ||
    key === "component" ||
    key === "concentration" ||
    key === "damageType" ||
    key === "higherLevel" ||
    key === "level" ||
    key === "ritual" ||
    key === "saveAbility" ||
    key === "source"
  ) {
    return key;
  }

  return null;
}

function SpellsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasHydratedPersistedFiltersRef = useRef(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { data: spells = [], error, isError, isLoading, refetch } = useSpells();
  const { filteredSpells, filters } = useSpellFilters(spells, searchParams);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const isAdminMode = searchParams.get("admin") === "true";
  const filterGroups = useMemo<SpellFilterGroupType[]>(
    () => getSpellFilterGroups(spells),
    [spells]
  );
  const homeIntentFilterGroupKey = getHomeIntentFilterGroupKey(searchParams);

  useEffect(() => {
    if (searchParams.get("intent") !== "search") {
      return;
    }

    searchRef.current?.focus();
    searchRef.current?.select();
  }, [searchParams]);

  useEffect(() => {
    if (hasHydratedPersistedFiltersRef.current) {
      return;
    }
    hasHydratedPersistedFiltersRef.current = true;

    const currentParams = new URLSearchParams(searchParams.toString());
    if (
      currentParams.has("intent") ||
      currentParams.has("filter") ||
      hasAnyFilterQueryParam(searchParams, SPELL_PERSISTED_QUERY_KEYS)
    ) {
      return;
    }

    const persistedParams = readPersistedFilterQueryParams(
      SPELL_FILTER_STORAGE_KEY
    );
    if (!persistedParams) {
      return;
    }

    const nextParams = applyPersistedFilterQueryParams(
      currentParams,
      persistedParams,
      SPELL_PERSISTED_QUERY_KEYS
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
      SPELL_FILTER_STORAGE_KEY,
      searchParams,
      SPELL_PERSISTED_QUERY_KEYS
    );
  }, [searchParams]);

  useEffect(() => {
    let isActive = true;

    void getCollectionLastSyncedAt("spells").then((syncedAt) => {
      if (!isActive) {
        return;
      }

      setLastSyncedAt(syncedAt);
    });

    return () => {
      isActive = false;
    };
  }, [spells.length]);

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

  const updateGlobalMatchMode = (mode: SpellMatchMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (mode === "and") {
      params.delete(SPELL_GROUP_MATCH_QUERY_PARAM);
    } else {
      params.set(SPELL_GROUP_MATCH_QUERY_PARAM, mode);
    }

    params.delete("intent");
    params.delete("filter");
    router.push(
      `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
    );
  };

  const updateSelectionMode = (
    key: SpellMultiSelectableGroupKey,
    mode: SpellSelectionMode
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    const selectionParam = SPELL_SELECTION_MODE_QUERY_PARAM_BY_KEY[key];
    if (mode === "single") {
      params.delete(selectionParam);
    } else {
      params.set(selectionParam, mode);
    }

    if (mode === "single") {
      const filterParam = SPELL_FILTER_QUERY_PARAM_BY_KEY[key];
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
    key: SpellMultiSelectableGroupKey,
    mode: SpellMatchMode
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    const matchParam = SPELL_GROUP_MATCH_QUERY_PARAM_BY_KEY[key];
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

  const getActiveValues = (key: SpellFilterGroupKey): string[] => {
    if (isMultiSelectableGroupKey(key)) {
      const selected = filters[key];
      return selected.length ? selected : [ALL_FILTER_VALUE];
    }

    const value = filters[key];
    return value === ALL_FILTER_VALUE ? [ALL_FILTER_VALUE] : [value];
  };

  const hasActiveFilters = hasAnyFilterQueryParam(
    searchParams,
    SPELL_PERSISTED_QUERY_KEYS
  );

  const resetAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    clearFilterQueryParams(params, SPELL_PERSISTED_QUERY_KEYS);
    params.delete("intent");
    params.delete("filter");
    window.localStorage.removeItem(SPELL_FILTER_STORAGE_KEY);
    router.push(
      `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <section className="surface-card p-6">
        <h1 className="typography-h1">Spells</h1>
        <SpellResultsSummary
          isLoading={isLoading}
          total={spells.length}
          visible={filteredSpells.length}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="typography-body-sm text-muted">
            Last synced: {lastSyncedLabel}
          </p>
          <div className="flex items-center gap-2">
            <CopyVisibleNamesAction
              disabled={isLoading || isError}
              itemTypeLabel="spell"
              names={filteredSpells.map((spell) => spell.name)}
            />
            <button
              className="admin-button-secondary typography-body-sm px-3 py-1"
              disabled={isRefreshing}
              onClick={async () => {
                setIsRefreshing(true);

                try {
                  await clearCollectionCache("spells");
                  await refetch();
                  const syncedAt = await getCollectionLastSyncedAt("spells");
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
              {getReadableFetchError(error, "spells")}
            </p>
            <button
              className="admin-button-secondary typography-body-sm px-3 py-1"
              onClick={() => {
                void refetch();
              }}
              type="button"
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          <div className="relative">
            <div className="flex items-center gap-2">
              <input
                className="input-field w-full px-3 py-2"
                onChange={(event) => {
                  updateSearchParam("q", event.target.value);
                }}
                placeholder="Search spells"
                ref={searchRef}
                value={filters.query}
              />
              <FilterLogicPopover
                globalMatchMode={filters.groupMatchMode}
                groups={MULTI_SELECTABLE_GROUPS.map((key) => ({
                  key,
                  label: SPELL_FILTER_GROUP_LABEL_BY_KEY[key],
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

          <div className="flex flex-wrap gap-1">
            {filterGroups.map((group) => (
              <FilterGroup
                activeValues={getActiveValues(group.key)}
                key={group.key}
                label={group.label}
                onChange={(values) => {
                  const queryParam = SPELL_FILTER_QUERY_PARAM_BY_KEY[group.key];
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
                storageKey={`spells:${group.key}`}
              />
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="typography-body-sm text-muted mt-4">
            Loading spells...
          </p>
        ) : null}
        {!isLoading && !isError && !filteredSpells.length ? (
          <p className="typography-body-sm text-muted mt-4">
            No spells match your filters.
          </p>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {filteredSpells.map((spell) => (
            <SpellCard
              isAdminMode={isAdminMode}
              key={spell.id}
              onSpellUpdated={async () => {
                const syncedAt = await getCollectionLastSyncedAt("spells");
                setLastSyncedAt(syncedAt);
              }}
              spell={spell}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default function SpellsPage() {
  return (
    <Suspense fallback={null}>
      <SpellsPageContent />
    </Suspense>
  );
}
