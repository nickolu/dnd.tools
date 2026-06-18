"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ToolWidgetCard,
  type WidgetFilterOption,
} from "@/components/tool-widget-card";
import {
  clearCollectionCache,
  getCollectionLastSyncedAt,
  getReadableFetchError,
} from "@/lib/api/client";
import { computeBalance } from "@/lib/domain/encounter/cr2";
import { useMonsters } from "@/lib/query/hooks/useMonsters";
import { useSpells } from "@/lib/query/hooks/useSpells";
import { useEncounterLibraryStore } from "@/lib/store/useEncounterLibraryStore";
import { useSavedMonsterListStore } from "@/lib/store/useSavedMonsterListStore";
import { useSavedSpellListStore } from "@/lib/store/useSavedSpellListStore";

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

const NEW_ENCOUNTER_CHIP_ID = "new";
const ENCOUNTERS_WIDGET_PINNED_CHIP: WidgetFilterOption = {
  id: NEW_ENCOUNTER_CHIP_ID,
  label: "+ New encounter",
};

export default function Home() {
  const savedSpellLists = useSavedSpellListStore((s) => s.lists);
  const savedMonsterLists = useSavedMonsterListStore((s) => s.lists);
  const savedEncounters = useEncounterLibraryStore((s) => s.encounters);

  const encounterWidgetFilters = useMemo<WidgetFilterOption[]>(() => {
    const recent = [...savedEncounters]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 6)
      .map<WidgetFilterOption>((e) => {
        const pcCount = e.partyMembers.length;
        const enemyCount = e.combatants.filter(
          (c) => c.side === "enemy"
        ).length;
        const parts: string[] = [];
        if (pcCount > 0) parts.push(`${pcCount} PC${pcCount !== 1 ? "s" : ""}`);
        if (enemyCount > 0)
          parts.push(`${enemyCount} ${enemyCount !== 1 ? "enemies" : "enemy"}`);
        if (pcCount > 0 && enemyCount > 0) {
          const balance = computeBalance(e);
          parts.push(balance.classification.bucket);
        }
        const sublabel = parts.length > 0 ? parts.join(" · ") : undefined;
        return {
          id: `open:${e.id}`,
          label: e.name,
          ...(sublabel !== undefined ? { sublabel } : {}),
        };
      });
    return [ENCOUNTERS_WIDGET_PINNED_CHIP, ...recent];
  }, [savedEncounters]);

  const spellWidgetFilters = useMemo<WidgetFilterOption[]>(() => {
    if (savedSpellLists.length === 0) return SPELL_WIDGET_FILTERS;

    const listChips: WidgetFilterOption[] = savedSpellLists.map((list) => ({
      id: `list:${list.id}`,
      label: list.name,
    }));
    return [...listChips, ...SPELL_WIDGET_FILTERS];
  }, [savedSpellLists]);

  const monsterWidgetFilters = useMemo<WidgetFilterOption[]>(() => {
    if (savedMonsterLists.length === 0) return MONSTER_WIDGET_FILTERS;

    const listChips: WidgetFilterOption[] = savedMonsterLists.map((list) => ({
      id: `list:${list.id}`,
      label: list.name,
    }));
    return [...listChips, ...MONSTER_WIDGET_FILTERS];
  }, [savedMonsterLists]);

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
  const [encounterSearch, setEncounterSearch] = useState("");
  const [monsterFilter, setMonsterFilter] = useState<string | undefined>(
    undefined
  );
  const [spellFilter, setSpellFilter] = useState<string | undefined>(undefined);
  const [encounterFilter, setEncounterFilter] = useState<string | undefined>(
    undefined
  );
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [isRetryingSpells, setIsRetryingSpells] = useState(false);
  const [isRetryingMonsters, setIsRetryingMonsters] = useState(false);
  const [lastSyncedSpellsAt, setLastSyncedSpellsAt] = useState<number | null>(
    null
  );
  const [lastSyncedMonstersAt, setLastSyncedMonstersAt] = useState<
    number | null
  >(null);

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

  useEffect(() => {
    let isActive = true;

    void Promise.all([
      getCollectionLastSyncedAt("spells"),
      getCollectionLastSyncedAt("monsters"),
    ]).then(([syncedSpellsAt, syncedMonstersAt]) => {
      if (!isActive) {
        return;
      }

      setLastSyncedSpellsAt(syncedSpellsAt);
      setLastSyncedMonstersAt(syncedMonstersAt);
    });

    return () => {
      isActive = false;
    };
  }, [spells.length, monsters.length]);

  const formatSynced = (value: number | null) =>
    value ? new Date(value).toLocaleString() : "Not synced yet";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <h1 className="typography-h1">Compendium Tools</h1>
      <p className="typography-body text-secondary">
        Select a widget and it will expand directly into the full tool page.
      </p>

      <section className="flex flex-col gap-6">
        <div className="surface-card flex flex-wrap items-center gap-3 p-3">
          <p className="typography-body-sm text-muted">
            Spells synced: {formatSynced(lastSyncedSpellsAt)}
          </p>
          <p className="typography-body-sm text-muted">
            Monsters synced: {formatSynced(lastSyncedMonstersAt)}
          </p>
          <button
            className="admin-button-secondary typography-body-sm ml-auto px-3 py-1"
            disabled={isRefreshingAll}
            onClick={async () => {
              setIsRefreshingAll(true);

              try {
                await clearCollectionCache("spells");
                await clearCollectionCache("monsters");
                await Promise.all([refetchSpells(), refetchMonsters()]);

                const [syncedSpellsAt, syncedMonstersAt] = await Promise.all([
                  getCollectionLastSyncedAt("spells"),
                  getCollectionLastSyncedAt("monsters"),
                ]);

                setLastSyncedSpellsAt(syncedSpellsAt);
                setLastSyncedMonstersAt(syncedMonstersAt);
              } finally {
                setIsRefreshingAll(false);
              }
            }}
            type="button"
          >
            {isRefreshingAll ? "Refreshing all..." : "Refresh all data"}
          </button>
        </div>

        {isSpellsError || isMonstersError ? (
          <div className="surface-card flex flex-wrap items-center gap-2 p-3">
            <p className="typography-body-sm text-secondary">
              Some compendium data failed to load.
            </p>
            {isSpellsError ? (
              <button
                className="admin-button-secondary typography-body-sm px-3 py-1"
                disabled={isRetryingSpells}
                onClick={async () => {
                  setIsRetryingSpells(true);
                  try {
                    await refetchSpells();
                  } finally {
                    setIsRetryingSpells(false);
                  }
                }}
                type="button"
              >
                {isRetryingSpells ? "Retrying…" : "Retry spells"}
              </button>
            ) : null}
            {isMonstersError ? (
              <button
                className="admin-button-secondary typography-body-sm px-3 py-1"
                disabled={isRetryingMonsters}
                onClick={async () => {
                  setIsRetryingMonsters(true);
                  try {
                    await refetchMonsters();
                  } finally {
                    setIsRetryingMonsters(false);
                  }
                }}
                type="button"
              >
                {isRetryingMonsters ? "Retrying…" : "Retry monsters"}
              </button>
            ) : null}
          </div>
        ) : null}

        <ToolWidgetCard
          description={spellsStatusMessage}
          filterOptions={spellWidgetFilters}
          onFilterSelect={setSpellFilter}
          onSearchChange={setSpellSearch}
          route="/spells"
          selectedFilterId={spellFilter}
          title="Spells"
          value={spellSearch}
        />

        <ToolWidgetCard
          description={monstersStatusMessage}
          filterOptions={monsterWidgetFilters}
          onFilterSelect={setMonsterFilter}
          onSearchChange={setMonsterSearch}
          route="/monsters"
          selectedFilterId={monsterFilter}
          title="Monsters"
          value={monsterSearch}
        />

        <ToolWidgetCard
          description={
            savedEncounters.length === 0
              ? "Build balanced encounters with CR 2.0 math."
              : `${savedEncounters.length} saved encounter${savedEncounters.length === 1 ? "" : "s"}`
          }
          filterOptions={encounterWidgetFilters}
          onFilterSelect={setEncounterFilter}
          onSearchChange={setEncounterSearch}
          route="/encounters"
          selectedFilterId={encounterFilter}
          title="Encounters"
          value={encounterSearch}
        />
      </section>
    </main>
  );
}
