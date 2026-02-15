"use client";

import { useMemo } from "react";
import { useState } from "react";

import {
  ToolWidgetCard,
  type WidgetFilterOption,
} from "@/components/tool-widget-card";
import { useMonsters } from "@/lib/query/hooks/useMonsters";
import { useSpells } from "@/lib/query/hooks/useSpells";

const SPELL_WIDGET_FILTERS: WidgetFilterOption[] = [
  { id: "evocation", label: "Evocation" },
  { id: "abjuration", label: "Abjuration" },
  { id: "necromancy", label: "Necromancy" },
];

const MONSTER_WIDGET_FILTERS: WidgetFilterOption[] = [
  { id: "Tiny", label: "Tiny" },
  { id: "Medium", label: "Medium" },
  { id: "Large", label: "Large" },
];

export default function Home() {
  const { data: monsters = [] } = useMonsters();
  const { data: spells = [] } = useSpells();

  const [monsterSearch, setMonsterSearch] = useState("");
  const [spellSearch, setSpellSearch] = useState("");
  const [monsterFilter, setMonsterFilter] = useState<string | undefined>(undefined);
  const [spellFilter, setSpellFilter] = useState<string | undefined>(undefined);

  const visibleMonsters = useMemo(() => {
    const normalizedFilter = monsterSearch.trim().toLowerCase();

    if (!normalizedFilter) {
      return monsters;
    }

    return monsters.filter((monster) =>
      monster.nameNormalized.includes(normalizedFilter)
    );
  }, [monsterSearch, monsters]);

  const visibleSpells = useMemo(() => {
    const normalizedFilter = spellSearch.trim().toLowerCase();

    if (!normalizedFilter) {
      return spells;
    }

    return spells.filter((spell) => spell.nameNormalized.includes(normalizedFilter));
  }, [spellSearch, spells]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Compendium Tools</h1>
      <p className="text-secondary">
        Select a widget and it will expand directly into the full tool page.
      </p>

      <section className="flex flex-col gap-6">
        <ToolWidgetCard
          description={`${visibleMonsters.length} visible of ${monsters.length} monsters`}
          filterOptions={MONSTER_WIDGET_FILTERS}
          onFilterSelect={setMonsterFilter}
          onSearchChange={setMonsterSearch}
          route="/monsters"
          selectedFilterId={monsterFilter}
          title="Monsters"
          value={monsterSearch}
        />

        <ToolWidgetCard
          description={`${visibleSpells.length} visible of ${spells.length} spells`}
          filterOptions={SPELL_WIDGET_FILTERS}
          onFilterSelect={setSpellFilter}
          onSearchChange={setSpellSearch}
          route="/spells"
          selectedFilterId={spellFilter}
          title="Spells"
          value={spellSearch}
        />
      </section>
    </main>
  );
}
