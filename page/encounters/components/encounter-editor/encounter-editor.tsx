"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useMonsters } from "@/lib/query/hooks/useMonsters";
import { selectEncounterById } from "@/lib/store/encounterSelectors";
import { useEncounterLibraryStore } from "@/lib/store/useEncounterLibraryStore";
import { useEncountersHasHydrated } from "@/lib/store/useEncountersHasHydrated";
import { useEncounterBalance } from "@/page/encounters/hooks/useEncounterBalance";

import { BalanceSummary } from "../balance-summary";
import { CombatantList } from "../combatant-list";
import { EncounterEditorSidebar } from "../encounter-editor-sidebar";
import { EncounterMap } from "../encounter-map";
import { InitiativeTracker } from "../initiative-tracker";
import { MonsterAddPanel } from "../monster-add-panel";
import { PartyRoster } from "../party-roster";
import { RulesetToggle } from "../ruleset-toggle";
import { SpellAggregatePanel } from "../spell-aggregate-panel";

type Props = {
  encounterId: string;
};

const EMPTY_ENCOUNTER = {
  id: "",
  name: "",
  ruleset: "advanced" as const,
  partyMembers: [],
  combatants: [],
  initiative: { round: 1, activeIndex: null },
  tips: null,
  tipsGeneratedAt: null,
  createdAt: 0,
  updatedAt: 0,
};

export function EncounterEditor({ encounterId }: Props) {
  const hydrated = useEncountersHasHydrated();
  const encounter = useEncounterLibraryStore(selectEncounterById(encounterId));
  const renameEncounter = useEncounterLibraryStore((s) => s.renameEncounter);
  const duplicateEncounter = useEncounterLibraryStore(
    (s) => s.duplicateEncounter
  );
  const deleteEncounter = useEncounterLibraryStore((s) => s.deleteEncounter);
  const setRuleset = useEncounterLibraryStore((s) => s.setRuleset);
  const router = useRouter();

  // Warm the monster cache so MonsterAddPanel renders quickly.
  useMonsters();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [setupOpen, setSetupOpen] = useState(true);
  const [mapFocused, setMapFocused] = useState(false);
  const [mapSidebarTab, setMapSidebarTab] = useState<"initiative" | "spells">(
    "initiative"
  );

  useEffect(() => {
    if (!mapFocused) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMapFocused(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mapFocused]);

  // Hook must run unconditionally — fall back to an empty shell when missing.
  const balance = useEncounterBalance(encounter ?? EMPTY_ENCOUNTER);

  if (!hydrated) {
    return (
      <main className="mx-auto flex w-full flex-col gap-4">
        <p className="typography-body-sm text-muted">Loading encounter...</p>
      </main>
    );
  }

  if (!encounter) {
    return (
      <main className="mx-auto flex w-full flex-col gap-4">
        <div className="surface-card flex flex-col items-start gap-2 p-4">
          <h1 className="typography-h1">Encounter not found</h1>
          <p className="typography-body-sm text-muted">
            We couldn&apos;t find an encounter with that ID.
          </p>
          <Link
            className="admin-button typography-body-sm px-3 py-1"
            href="/encounters"
          >
            Back to library
          </Link>
        </div>
      </main>
    );
  }

  const allies = encounter.combatants.filter((c) => c.side === "ally");

  function handleNameCommit() {
    if (!encounter) return;
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== encounter.name) {
      renameEncounter(encounter.id, trimmed);
    }
    setEditingName(false);
  }

  function handleDelete() {
    if (!encounter) return;
    if (
      window.confirm(
        `Delete encounter "${encounter.name}"? This cannot be undone.`
      )
    ) {
      deleteEncounter(encounter.id);
      router.push("/encounters");
    }
  }

  return (
    <main className="mx-auto flex w-full flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link
            className="typography-kicker text-muted hover:underline"
            href="/encounters"
          >
            ← All encounters
          </Link>
          {editingName ? (
            <input
              className="input-field typography-h1 px-2 py-1"
              value={nameDraft}
              autoFocus
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={handleNameCommit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameCommit();
                else if (e.key === "Escape") setEditingName(false);
              }}
            />
          ) : (
            <button
              type="button"
              className="typography-h1 text-left hover:underline"
              onClick={() => {
                setNameDraft(encounter.name);
                setEditingName(true);
              }}
            >
              {encounter.name}
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <RulesetToggle
            ruleset={encounter.ruleset}
            onChange={(next) => setRuleset(encounter.id, next)}
          />
          <button
            type="button"
            className="admin-button-secondary typography-body-sm px-3 py-1"
            onClick={() => setSetupOpen((v) => !v)}
            aria-pressed={setupOpen}
          >
            {setupOpen ? "Hide setup" : "Show setup"}
          </button>
          <button
            type="button"
            className="admin-button-secondary typography-body-sm px-3 py-1"
            onClick={() => setMapFocused(true)}
          >
            Focus map
          </button>
          <button
            type="button"
            className="admin-button-secondary typography-body-sm px-3 py-1"
            onClick={() => {
              const newId = duplicateEncounter(encounter.id);
              if (newId) router.push(`/encounters/${newId}`);
            }}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="admin-button-secondary typography-body-sm px-3 py-1"
            onClick={handleDelete}
          >
            Delete encounter
          </button>
        </div>
      </header>

      {/* Mobile: stacked layout with collapsible setup */}
      <div className="flex flex-col gap-4 lg:hidden">
        {setupOpen && (
          <div className="flex flex-col gap-4">
            <PartyRoster
              encounterId={encounter.id}
              partyMembers={encounter.partyMembers}
              allies={allies}
            />
            <MonsterAddPanel encounterId={encounter.id} />
            <BalanceSummary
              result={balance}
              hasParty={encounter.partyMembers.length > 0}
            />
            <CombatantList
              encounterId={encounter.id}
              combatants={encounter.combatants}
            />
          </div>
        )}
        <EncounterEditorSidebar encounterId={encounter.id} />
      </div>

      {/* Desktop: sidebar layout with fixed-width setup column */}
      <div
        className="hidden gap-4 lg:grid"
        style={{
          gridTemplateColumns: setupOpen ? "320px 1fr" : "1fr",
        }}
      >
        {setupOpen && (
          <div className="flex flex-col gap-4">
            <PartyRoster
              encounterId={encounter.id}
              partyMembers={encounter.partyMembers}
              allies={allies}
            />
            <MonsterAddPanel encounterId={encounter.id} />
            <BalanceSummary
              result={balance}
              hasParty={encounter.partyMembers.length > 0}
            />
            <CombatantList
              encounterId={encounter.id}
              combatants={encounter.combatants}
            />
          </div>
        )}
        <div className="flex flex-col gap-4">
          <EncounterEditorSidebar encounterId={encounter.id} />
        </div>
      </div>

      {/* Full-screen map overlay */}
      {mapFocused && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "var(--color-canvas)",
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: "1rem",
            padding: "1rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
              }}
            >
              <span className="typography-h2">{encounter.name} — Map</span>
              <button
                type="button"
                className="admin-button-secondary typography-body-sm px-3 py-1"
                onClick={() => setMapFocused(false)}
              >
                Exit map
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <EncounterMap encounterId={encounter.id} />
            </div>
          </div>
          <div
            style={{
              overflow: "auto",
              borderLeft: "1px solid var(--color-border-subtle)",
              paddingLeft: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div className="flex gap-1" role="tablist" aria-label="Map sidebar">
              <button
                type="button"
                className="filter-chip"
                role="tab"
                aria-selected={mapSidebarTab === "initiative"}
                data-active={mapSidebarTab === "initiative"}
                onClick={() => setMapSidebarTab("initiative")}
              >
                Initiative
              </button>
              <button
                type="button"
                className="filter-chip"
                role="tab"
                aria-selected={mapSidebarTab === "spells"}
                data-active={mapSidebarTab === "spells"}
                onClick={() => setMapSidebarTab("spells")}
              >
                Spells
              </button>
            </div>
            {mapSidebarTab === "initiative" ? (
              <InitiativeTracker encounterId={encounter.id} />
            ) : (
              <SpellAggregatePanel encounterId={encounter.id} />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
