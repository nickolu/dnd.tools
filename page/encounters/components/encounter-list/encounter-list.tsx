"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { useEncounterLibraryStore } from "@/lib/store/useEncounterLibraryStore";
import { useEncountersHasHydrated } from "@/lib/store/useEncountersHasHydrated";

export function EncounterList() {
  const encounters = useEncounterLibraryStore((s) => s.encounters);
  const createEncounter = useEncounterLibraryStore((s) => s.createEncounter);
  const duplicateEncounter = useEncounterLibraryStore(
    (s) => s.duplicateEncounter
  );
  const deleteEncounter = useEncounterLibraryStore((s) => s.deleteEncounter);
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useEncountersHasHydrated();
  const intentHandledRef = useRef(false);

  function handleCreate() {
    const id = createEncounter();
    if (id) router.push(`/encounters/${id}`);
  }

  // Handle filter intents from the home widget once IDB has hydrated.
  // `filter=new` creates a fresh encounter; `filter=open:<id>` opens an existing one.
  useEffect(() => {
    if (!hydrated || intentHandledRef.current) return;
    const filter = searchParams?.get("filter");
    if (!filter) return;
    if (filter === "new") {
      intentHandledRef.current = true;
      const id = createEncounter();
      if (id) router.replace(`/encounters/${id}`);
      return;
    }
    if (filter.startsWith("open:")) {
      const id = filter.slice("open:".length);
      if (encounters.some((e) => e.id === id)) {
        intentHandledRef.current = true;
        router.replace(`/encounters/${id}`);
      }
    }
  }, [hydrated, searchParams, encounters, createEncounter, router]);

  const sorted = [...encounters].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="typography-h1">Encounters</h1>
        <button
          type="button"
          className="admin-button typography-body-sm px-3 py-1"
          onClick={handleCreate}
        >
          + New encounter
        </button>
      </header>
      {sorted.length === 0 ? (
        <div className="surface-card flex flex-col gap-2 p-4">
          <p className="typography-body">
            No saved encounters yet. Click &quot;New encounter&quot; to start
            building one.
          </p>
          <p className="typography-body-sm text-muted">
            Encounters are saved in this browser only.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {sorted.map((e) => {
            const enemyCount = e.combatants.filter(
              (c) => c.side === "enemy"
            ).length;
            const allyCount = e.combatants.filter(
              (c) => c.side === "ally"
            ).length;
            return (
              <li key={e.id} className="surface-card flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    href={`/encounters/${e.id}`}
                    className="typography-h2 hover:underline"
                  >
                    {e.name}
                  </Link>
                  <span className="typography-body-sm text-muted">
                    {new Date(e.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="typography-body-sm text-muted flex flex-wrap gap-3">
                  <span>
                    {e.partyMembers.length} PC
                    {e.partyMembers.length === 1 ? "" : "s"}
                  </span>
                  <span>{enemyCount} enemies</span>
                  <span>{allyCount} allies</span>
                  <span>Advanced</span>
                </div>
                <div className="flex gap-2">
                  <Link
                    className="admin-button typography-body-sm px-3 py-1"
                    href={`/encounters/${e.id}`}
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    className="admin-button-secondary typography-body-sm px-3 py-1"
                    onClick={() => {
                      const newId = duplicateEncounter(e.id);
                      if (newId) router.push(`/encounters/${newId}`);
                    }}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="admin-button-secondary typography-body-sm px-3 py-1"
                    onClick={() => {
                      if (window.confirm(`Delete encounter "${e.name}"?`)) {
                        deleteEncounter(e.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
