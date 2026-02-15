"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import { FilterGroup } from "@/components/filter-group";
import { useSpells } from "@/lib/query/hooks/useSpells";
import { SpellCard, SpellResultsSummary } from "@/page/spells/components";
import { SPELL_FILTER_QUERY_PARAM_BY_KEY } from "@/page/spells/constants";
import { useSpellFilters } from "@/page/spells/hooks/useSpellFilters";
import type { SpellFilterGroup as SpellFilterGroupType } from "@/page/spells/types";
import { getSpellFilterGroups } from "@/page/spells/utils/getSpellFilterGroups";

export default function SpellsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <section className="surface-card p-6">
        <h1 className="typography-h1">Spells</h1>
        <SpellResultsSummary total={spells.length} visible={filteredSpells.length} />

        <div className="mt-4 space-y-3">
          <input
            className="input-field w-full px-3 py-2"
            onChange={(event) => {
              updateSearchParam("q", event.target.value);
            }}
            placeholder="Search spells"
            ref={searchRef}
            value={filters.query}
          />

          <div className="flex flex-wrap gap-3">
            {filterGroups.map((group) => (
              <FilterGroup
                activeValue={filters[group.key]}
                className="mr-2"
                key={group.key}
                label={group.label}
                onChange={(value) => {
                  const queryParam = SPELL_FILTER_QUERY_PARAM_BY_KEY[group.key];
                  updateSearchParam(queryParam, value === "all" ? "" : value);
                }}
                options={group.options}
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
