"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { FilterGroup } from "@/components/filter-group";
import { useSpells } from "@/lib/query/hooks/useSpells";
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
  "classes",
  "component",
];

function isMultiSelectableGroupKey(
  key: SpellFilterGroupKey
): key is SpellMultiSelectableGroupKey {
  return key === "classes" || key === "component";
}

export default function SpellsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isLogicPopoverOpen, setIsLogicPopoverOpen] = useState(false);
  const { data: spells = [], isLoading } = useSpells();
  const { filteredSpells, filters } = useSpellFilters(spells, searchParams);
  const filterGroups = useMemo<SpellFilterGroupType[]>(
    () => getSpellFilterGroups(spells),
    [spells]
  );

  useEffect(() => {
    if (searchParams.get("intent") !== "search") {
      return;
    }

    searchRef.current?.focus();
    searchRef.current?.select();
  }, [searchParams]);

  useEffect(() => {
    if (!isLogicPopoverOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target)
      ) {
        setIsLogicPopoverOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLogicPopoverOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isLogicPopoverOpen]);

  const updateSearchParam = (queryParam: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(queryParam, value);
    } else {
      params.delete(queryParam);
    }

    params.delete("intent");
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const updateMultiSearchParam = (queryParam: string, values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(queryParam);

    values
      .filter((value) => value !== ALL_FILTER_VALUE)
      .forEach((value) => params.append(queryParam, value));

    params.delete("intent");
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const updateGlobalMatchMode = (mode: SpellMatchMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (mode === "and") {
      params.delete(SPELL_GROUP_MATCH_QUERY_PARAM);
    } else {
      params.set(SPELL_GROUP_MATCH_QUERY_PARAM, mode);
    }

    params.delete("intent");
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
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
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
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
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const getActiveValues = (key: SpellFilterGroupKey): string[] => {
    if (key === "classes" || key === "component") {
      const selected = filters[key];
      return selected.length ? selected : [ALL_FILTER_VALUE];
    }

    const value = filters[key];
    return value === ALL_FILTER_VALUE ? [ALL_FILTER_VALUE] : [value];
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <section className="surface-card p-6">
        <h1 className="typography-h1">Spells</h1>
        <SpellResultsSummary total={spells.length} visible={filteredSpells.length} />

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
              <div className="filter-logic-popover" ref={popoverRef}>
                <button
                  aria-label="Open filter logic options"
                  aria-expanded={isLogicPopoverOpen}
                  aria-haspopup="dialog"
                  className="filter-logic-trigger"
                  data-open={isLogicPopoverOpen}
                  onClick={() => {
                    setIsLogicPopoverOpen((current) => !current);
                  }}
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M4 7h16M7 12h10M10 17h4"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                  <span className="sr-only">Filter Logic</span>
                </button>
                {isLogicPopoverOpen ? (
                  <div className="filter-logic-popover-panel surface-card" role="dialog">
                    <div className="mt-2 space-y-2 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="typography-body-sm text-secondary">
                          Across groups
                        </span>
                        <button
                          className="filter-chip cursor-pointer"
                          data-active={filters.groupMatchMode === "and"}
                          onClick={() => {
                            updateGlobalMatchMode("and");
                          }}
                          type="button"
                        >
                          AND
                        </button>
                        <button
                          className="filter-chip cursor-pointer"
                          data-active={filters.groupMatchMode === "or"}
                          onClick={() => {
                            updateGlobalMatchMode("or");
                          }}
                          type="button"
                        >
                          OR
                        </button>
                      </div>

                      {MULTI_SELECTABLE_GROUPS.map((key) => (
                        <div className="flex flex-wrap items-center gap-2" key={key}>
                          <span className="typography-body-sm text-secondary capitalize">
                            {key}
                          </span>
                          <button
                            className="filter-chip cursor-pointer"
                            data-active={filters.selectionModeByKey[key] === "single"}
                            onClick={() => {
                              updateSelectionMode(key, "single");
                            }}
                            type="button"
                          >
                            Single
                          </button>
                          <button
                            className="filter-chip cursor-pointer"
                            data-active={filters.selectionModeByKey[key] === "multi"}
                            onClick={() => {
                              updateSelectionMode(key, "multi");
                            }}
                            type="button"
                          >
                            Multi
                          </button>
                          {filters.selectionModeByKey[key] === "multi" ? (
                            <>
                              <span className="typography-body-sm text-secondary">
                                within
                              </span>
                              <button
                                className="filter-chip cursor-pointer"
                                data-active={filters.groupMatchModeByKey[key] === "or"}
                                onClick={() => {
                                  updateGroupMatchModeByKey(key, "or");
                                }}
                                type="button"
                              >
                                OR
                              </button>
                              <button
                                className="filter-chip cursor-pointer"
                                data-active={filters.groupMatchModeByKey[key] === "and"}
                                onClick={() => {
                                  updateGroupMatchModeByKey(key, "and");
                                }}
                                type="button"
                              >
                                AND
                              </button>
                            </>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
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
                storageKey={`spells:${group.key}`}
              />
            ))}
          </div>
        </div>

        {isLoading ? <p className="typography-body-sm text-muted mt-4">Loading spells...</p> : null}
        {!isLoading && !filteredSpells.length ? (
          <p className="typography-body-sm text-muted mt-4">
            No spells match your filters.
          </p>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {filteredSpells.map((spell) => (
            <SpellCard key={spell.id} spell={spell} />
          ))}
        </div>
      </section>
    </main>
  );
}
