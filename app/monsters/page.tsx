"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { FilterChip } from "@/components/tool-widget-card/components/filter-chip";
import { useMonsters } from "@/lib/query/hooks/useMonsters";
import { MonsterCard, MonsterResultsSummary } from "@/page/monsters/components";
import { MONSTER_SIZE_FILTERS } from "@/page/monsters/constants";
import { useMonsterFilters } from "@/page/monsters/hooks/useMonsterFilters";

export default function MonstersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const { data: monsters = [], isLoading } = useMonsters();
  const { filteredMonsters, filters } = useMonsterFilters(monsters, searchParams);

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
        <h1 className="typography-h1">Monsters</h1>
        <MonsterResultsSummary
          total={monsters.length}
          visible={filteredMonsters.length}
        />

        <div className="mt-4 space-y-3">
          <input
            className="input-field w-full px-3 py-2"
            onChange={(event) => {
              updateSearchParam("q", event.target.value.trim());
            }}
            placeholder="Search monsters"
            ref={searchRef}
            value={filters.query}
          />
          <div className="flex flex-wrap gap-2">
            {MONSTER_SIZE_FILTERS.map((size) => (
              <FilterChip
                isActive={filters.size === size}
                key={size}
                label={size === "all" ? "All" : size}
                onClick={() => {
                  updateSearchParam("size", size === "all" ? "" : size);
                }}
              />
            ))}
          </div>
        </div>

        {isLoading ? <p className="typography-body-sm text-muted mt-4">Loading monsters...</p> : null}
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
