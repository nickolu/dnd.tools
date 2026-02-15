"use client";

import { useMemo } from "react";
import { useState } from "react";

import {
  ToolWidgetCard,
  type WidgetFilterOption,
} from "@/components/tool-widget-card";
import { getReadableFetchError } from "@/lib/api/client";
import { useMonsters } from "@/lib/query/hooks/useMonsters";
import { useSpells } from "@/lib/query/hooks/useSpells";

const SPELL_WIDGET_FILTERS: WidgetFilterOption[] = [
  { id: "classes:wizard", label: "Wizard" },
  { id: "classes:sorcerer", label: "Sorcerer" },
  { id: "classes:cleric", label: "Cleric" },
  { id: "classes:druid", label: "Druid" },
  { id: "level:0", label: "Cantrip" },
  { id: "level:1", label: "Level 1" },
  { id: "level:3", label: "Level 3" },
  { id: "level:5", label: "Level 5" },
  { id: "concentration:yes", label: "Concentration" },
  { id: "ritual:yes", label: "Ritual" },
];

const MONSTER_WIDGET_FILTERS: WidgetFilterOption[] = [
  { id: "size:Small", label: "Small" },
  { id: "size:Medium", label: "Medium" },
  { id: "size:Large", label: "Large" },
  { id: "size:Huge", label: "Huge" },
  { id: "type:humanoid", label: "Humanoid" },
  { id: "type:dragon", label: "Dragon" },
  { id: "type:undead", label: "Undead" },
  { id: "type:fiend", label: "Fiend" },
  { id: "alignmentMoral:good", label: "Good" },
  { id: "alignmentMoral:evil", label: "Evil" },
  { id: "senses:blindsight", label: "Blindsight" },
  { id: "senses:darkvision", label: "Darkvision" },
];

export default function Home() {
  const {
    data: monsters = [],
    error: monstersError,
    isError: isMonstersError,
    isLoading: isMonstersLoading,
    refetch: refetchMonsters,
  } = useMonsters();
  const {
    data: spells = [],
    error: spellsError,
    isError: isSpellsError,
    isLoading: isSpellsLoading,
    refetch: refetchSpells,
  } = useSpells();

  const [monsterSearch, setMonsterSearch] = useState("");
  const [spellSearch, setSpellSearch] = useState("");
  const [monsterFilter, setMonsterFilter] = useState<string | undefined>(
    undefined
  );
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

    return spells.filter((spell) =>
      spell.nameNormalized.includes(normalizedFilter)
    );
  }, [spellSearch, spells]);

  const spellsStatusMessage = isSpellsError
    ? getReadableFetchError(spellsError, "spells")
    : isSpellsLoading
      ? "Loading spells..."
      : `${visibleSpells.length} visible of ${spells.length} spells`;

  const monstersStatusMessage = isMonstersError
    ? getReadableFetchError(monstersError, "monsters")
    : isMonstersLoading
      ? "Loading monsters..."
      : `${visibleMonsters.length} visible of ${monsters.length} monsters`;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <h1 className="typography-h1">Compendium Tools</h1>
      <p className="typography-body text-secondary">
        Select a widget and it will expand directly into the full tool page.
      </p>

      <section className="flex flex-col gap-6">
        {isSpellsError || isMonstersError ? (
          <div className="surface-card flex flex-wrap items-center gap-2 p-3">
            <p className="typography-body-sm text-secondary">
              Some compendium data failed to load.
            </p>
            {isSpellsError ? (
              <button
                className="admin-button-secondary typography-body-sm px-3 py-1"
                onClick={() => {
                  void refetchSpells();
                }}
                type="button"
              >
                Retry spells
              </button>
            ) : null}
            {isMonstersError ? (
              <button
                className="admin-button-secondary typography-body-sm px-3 py-1"
                onClick={() => {
                  void refetchMonsters();
                }}
                type="button"
              >
                Retry monsters
              </button>
            ) : null}
          </div>
        ) : null}

        <ToolWidgetCard
          description={spellsStatusMessage}
          filterOptions={SPELL_WIDGET_FILTERS}
          onFilterSelect={setSpellFilter}
          onSearchChange={setSpellSearch}
          route="/spells"
          selectedFilterId={spellFilter}
          title="Spells"
          value={spellSearch}
        />

        <ToolWidgetCard
          description={monstersStatusMessage}
          filterOptions={MONSTER_WIDGET_FILTERS}
          onFilterSelect={setMonsterFilter}
          onSearchChange={setMonsterSearch}
          route="/monsters"
          selectedFilterId={monsterFilter}
          title="Monsters"
          value={monsterSearch}
        />
      </section>
    </main>
  );
}
