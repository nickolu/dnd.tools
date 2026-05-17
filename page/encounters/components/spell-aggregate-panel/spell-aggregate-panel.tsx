"use client";

import { useMemo, useSyncExternalStore } from "react";

import { useMonsters } from "@/lib/query/hooks/useMonsters";
import { useSpells } from "@/lib/query/hooks/useSpells";
import { selectEncounterById } from "@/lib/store/encounterSelectors";
import { useEncounterLibraryStore } from "@/lib/store/useEncounterLibraryStore";
import { aggregateSpells } from "@/page/encounters/utils/aggregateSpells";

import { SpellSummaryRow } from "./components/spell-summary-row";
import {
  DEFAULT_GROUPING,
  GROUPING_LABEL,
  GROUPING_OPTIONS,
  GROUPING_STORAGE_KEY,
} from "./constants";
import type { SpellAggregateGrouping } from "./types";
import { groupByLevel, groupBySchool } from "./utils/groupAggregatedSpells";

type Props = {
  encounterId: string;
};

const STORAGE_EVENT_NAME = "dnd-tools-grouping-storage";

function readStoredGrouping(): SpellAggregateGrouping {
  if (typeof window === "undefined") return DEFAULT_GROUPING;
  const raw = window.localStorage.getItem(GROUPING_STORAGE_KEY);
  if (raw === "level" || raw === "school") return raw;
  return DEFAULT_GROUPING;
}

function subscribeToGrouping(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: StorageEvent) => {
    if (e.key === GROUPING_STORAGE_KEY) onChange();
  };
  const localHandler = () => onChange();
  window.addEventListener("storage", handler);
  window.addEventListener(STORAGE_EVENT_NAME, localHandler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(STORAGE_EVENT_NAME, localHandler);
  };
}

function getGroupingServerSnapshot(): SpellAggregateGrouping {
  return DEFAULT_GROUPING;
}

export function SpellAggregatePanel({ encounterId }: Props) {
  const encounter = useEncounterLibraryStore(selectEncounterById(encounterId));
  const { data: monsters = [], isLoading: monstersLoading } = useMonsters();
  const { data: spells = [], isLoading: spellsLoading } = useSpells();

  const grouping = useSyncExternalStore(
    subscribeToGrouping,
    readStoredGrouping,
    getGroupingServerSnapshot
  );

  function handleGroupingChange(next: SpellAggregateGrouping) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(GROUPING_STORAGE_KEY, next);
    window.dispatchEvent(new Event(STORAGE_EVENT_NAME));
  }

  const monstersById = useMemo(
    () => new Map(monsters.map((m) => [m.id, m])),
    [monsters]
  );
  const spellsByNormalizedName = useMemo(
    () => new Map(spells.map((s) => [s.nameNormalized, s])),
    [spells]
  );

  const aggregate = useMemo(() => {
    if (!encounter) return { spells: [], unresolved: [] };
    return aggregateSpells(
      encounter.combatants,
      monstersById,
      spellsByNormalizedName
    );
  }, [encounter, monstersById, spellsByNormalizedName]);

  const groups = useMemo(() => {
    if (grouping === "school") return groupBySchool(aggregate.spells);
    return groupByLevel(aggregate.spells);
  }, [aggregate.spells, grouping]);

  if (!encounter) return null;

  const isCatalogLoading = monstersLoading || spellsLoading;
  const hasCombatants = encounter.combatants.length > 0;
  const hasSpells = aggregate.spells.length > 0;

  return (
    <section className="surface-card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="typography-h2">Spells</h2>
        <div className="flex gap-1" role="group" aria-label="Group spells by">
          {GROUPING_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              className="filter-chip"
              data-active={value === grouping}
              onClick={() => handleGroupingChange(value)}
              aria-pressed={value === grouping}
            >
              {GROUPING_LABEL[value]}
            </button>
          ))}
        </div>
      </div>

      {isCatalogLoading ? (
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <li
              key={i}
              className="rounded-md border p-2"
              style={{ borderColor: "var(--color-border-subtle)" }}
            >
              <p className="typography-body-sm text-muted">Loading spells...</p>
            </li>
          ))}
        </ul>
      ) : !hasCombatants ? (
        <p className="typography-body-sm text-muted">
          Add monsters to see their combined spell list.
        </p>
      ) : !hasSpells ? (
        <p className="typography-body-sm text-muted">
          None of the monsters in this encounter cast spells.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <div key={group.key} className="flex flex-col gap-1.5">
              <span className="typography-kicker text-muted">
                {group.label}
              </span>
              <ul className="flex flex-col gap-1.5">
                {group.spells.map((entry) => (
                  <SpellSummaryRow key={entry.spell.id} entry={entry} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {aggregate.unresolved.length > 0 ? (
        <div
          className="rounded-md border p-2"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <p className="typography-body-sm text-secondary">
            {aggregate.unresolved.length} spell name
            {aggregate.unresolved.length === 1 ? "" : "s"} could not be linked:{" "}
            {aggregate.unresolved.join(", ")}
          </p>
        </div>
      ) : null}
    </section>
  );
}
