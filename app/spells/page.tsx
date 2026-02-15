"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { FilterChip } from "@/components/tool-widget-card/components/filter-chip";
import { useSpells } from "@/lib/query/hooks/useSpells";
import { SpellResultsSummary } from "@/page/spells/components";
import { SPELL_SCHOOL_FILTERS } from "@/page/spells/constants";
import { useSpellFilters } from "@/page/spells/hooks/useSpellFilters";

export default function SpellsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const { data: spells = [], isLoading } = useSpells();
  const { filteredSpells, filters } = useSpellFilters(spells, searchParams);

  useEffect(() => {
    if (searchParams.get("intent") !== "search") {
      return;
    }

    searchRef.current?.focus();
    searchRef.current?.select();
  }, [searchParams]);

  const updateSearchParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.delete("intent");
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <section className="surface-card p-6">
        <h1 className="mb-2 text-2xl font-semibold">Spells</h1>
        <SpellResultsSummary total={spells.length} visible={filteredSpells.length} />

        <div className="mt-4 space-y-3">
          <input
            className="input-field w-full px-3 py-2"
            onChange={(event) => {
              updateSearchParam("q", event.target.value.trim());
            }}
            placeholder="Search spells"
            ref={searchRef}
            value={filters.query}
          />
          <div className="flex flex-wrap gap-2">
            {SPELL_SCHOOL_FILTERS.map((school) => (
              <FilterChip
                isActive={filters.school === school}
                key={school}
                label={school === "all" ? "All" : school}
                onClick={() => {
                  updateSearchParam("school", school === "all" ? "" : school);
                }}
              />
            ))}
          </div>
        </div>

        <ul className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          {isLoading ? (
            <li className="text-muted">Loading spells...</li>
          ) : (
            filteredSpells.map((spell) => (
              <li className="border-b border-[color:var(--color-border-subtle)] pb-1" key={spell.id}>
                {spell.name}
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
