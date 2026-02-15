"use client";

import { useMemo } from "react";

import { useMetaVersion } from "@/lib/query/hooks/useMetaVersion";
import { useMonsters } from "@/lib/query/hooks/useMonsters";
import { useSpells } from "@/lib/query/hooks/useSpells";
import { useCompendiumStore } from "@/lib/store/useCompendiumStore";

export default function Home() {
  const { data: monsters = [], isLoading: monstersLoading } = useMonsters();
  const { data: spells = [], isLoading: spellsLoading } = useSpells();
  const { data: version } = useMetaVersion();

  const monsterFilter = useCompendiumStore((state) => state.filters.monsterName);
  const spellFilter = useCompendiumStore((state) => state.filters.spellName);
  const setMonsterFilter = useCompendiumStore((state) => state.setMonsterFilter);
  const setSpellFilter = useCompendiumStore((state) => state.setSpellFilter);

  const visibleMonsters = useMemo(() => {
    const normalizedFilter = monsterFilter.trim().toLowerCase();

    if (!normalizedFilter) {
      return monsters;
    }

    return monsters.filter((monster) =>
      monster.nameNormalized.includes(normalizedFilter)
    );
  }, [monsterFilter, monsters]);

  const visibleSpells = useMemo(() => {
    const normalizedFilter = spellFilter.trim().toLowerCase();

    if (!normalizedFilter) {
      return spells;
    }

    return spells.filter((spell) => spell.nameNormalized.includes(normalizedFilter));
  }, [spellFilter, spells]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-8 py-10">
      <h1 className="text-2xl font-semibold">dnd.tools compendium bootstrap</h1>

      <p>
        Meta versions: monsters {version?.monstersVersion ?? 0}, spells{" "}
        {version?.spellsVersion ?? 0}
      </p>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded border p-4">
          <h2 className="mb-2 text-xl font-medium">Monsters</h2>
          <input
            className="mb-3 w-full rounded border px-2 py-1"
            onChange={(event) => {
              setMonsterFilter(event.target.value);
            }}
            placeholder="Filter monsters"
            value={monsterFilter}
          />
          <p className="mb-2 text-sm text-gray-700">
            {monstersLoading
              ? "Loading..."
              : `${visibleMonsters.length} visible of ${monsters.length}`}
          </p>
          <ul className="space-y-1 text-sm">
            {visibleMonsters.slice(0, 5).map((monster) => (
              <li key={monster.id}>{monster.name}</li>
            ))}
          </ul>
        </div>

        <div className="rounded border p-4">
          <h2 className="mb-2 text-xl font-medium">Spells</h2>
          <input
            className="mb-3 w-full rounded border px-2 py-1"
            onChange={(event) => {
              setSpellFilter(event.target.value);
            }}
            placeholder="Filter spells"
            value={spellFilter}
          />
          <p className="mb-2 text-sm text-gray-700">
            {spellsLoading
              ? "Loading..."
              : `${visibleSpells.length} visible of ${spells.length}`}
          </p>
          <ul className="space-y-1 text-sm">
            {visibleSpells.slice(0, 5).map((spell) => (
              <li key={spell.id}>{spell.name}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
