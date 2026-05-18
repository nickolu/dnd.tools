"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { SearchInput } from "@/components/search-input";
import { useEncounterLibraryStore } from "@/lib/store/useEncounterLibraryStore";
import { useEncountersHasHydrated } from "@/lib/store/useEncountersHasHydrated";

export function EncounterList() {
  const encounters = useEncounterLibraryStore((s) => s.encounters);
  const templates = useEncounterLibraryStore((s) => s.templates);
  const createEncounter = useEncounterLibraryStore((s) => s.createEncounter);
  const duplicateEncounter = useEncounterLibraryStore(
    (s) => s.duplicateEncounter
  );
  const deleteEncounter = useEncounterLibraryStore((s) => s.deleteEncounter);
  const deleteTemplate = useEncounterLibraryStore((s) => s.deleteTemplate);
  const createFromTemplate = useEncounterLibraryStore(
    (s) => s.createFromTemplate
  );
  const exportEncounters = useEncounterLibraryStore((s) => s.exportEncounters);
  const importEncounters = useEncounterLibraryStore((s) => s.importEncounters);
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useEncountersHasHydrated();
  const intentHandledRef = useRef(false);
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<
    string | null
  >(null);
  const confirmTemplateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDeleteEncounterId, setConfirmDeleteEncounterId] = useState<
    string | null
  >(null);
  const confirmEncounterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<string | null>(null);

  function clearTemplateTimer() {
    if (confirmTemplateTimerRef.current !== null) {
      clearTimeout(confirmTemplateTimerRef.current);
      confirmTemplateTimerRef.current = null;
    }
  }

  function clearEncounterTimer() {
    if (confirmEncounterTimerRef.current !== null) {
      clearTimeout(confirmEncounterTimerRef.current);
      confirmEncounterTimerRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      clearTemplateTimer();
      clearEncounterTimer();
    };
  }, []);

  function handleCreate() {
    const id = createEncounter();
    if (id) router.push(`/encounters/${id}`);
  }

  function handleExport() {
    const json = exportEncounters();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dnd-tools-encounters.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = e.target?.result;
        if (typeof raw !== "string") throw new Error("Could not read file.");
        const result = importEncounters(raw);
        setImportResult(
          `Imported ${result.imported} encounter(s)${result.skipped > 0 ? `, skipped ${result.skipped} duplicate(s)` : ""}`
        );
        setTimeout(() => setImportResult(null), 3000);
      } catch {
        setImportResult("Import failed: invalid file format");
        setTimeout(() => setImportResult(null), 3000);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
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

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((e) => e.name.toLowerCase().includes(q));
  }, [sorted, searchQuery]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="typography-h1">Encounters</h1>
        <div className="flex flex-wrap items-center gap-2">
          {encounters.length > 0 && (
            <button
              type="button"
              className="admin-button-secondary typography-body-sm px-3 py-1"
              onClick={handleExport}
            >
              Export
            </button>
          )}
          <button
            type="button"
            className="admin-button-secondary typography-body-sm px-3 py-1"
            onClick={() => fileInputRef.current?.click()}
          >
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImport}
          />
          <button
            type="button"
            className="admin-button typography-body-sm px-3 py-1"
            onClick={handleCreate}
          >
            + New encounter
          </button>
        </div>
      </header>
      {importResult && (
        <p className="typography-body-sm text-muted">{importResult}</p>
      )}
      {sorted.length > 3 ? (
        <SearchInput
          placeholder="Search encounters"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery("")}
        />
      ) : null}
      {templates.length > 0 && (
        <section className="surface-card flex flex-col gap-2 p-4">
          <span className="typography-kicker text-muted">From template</span>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center gap-1">
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => {
                    const id = createFromTemplate(t.id);
                    if (id) router.push(`/encounters/${id}`);
                  }}
                >
                  {t.name}
                </button>
                <button
                  type="button"
                  className="admin-button-danger typography-body-sm px-1.5 py-0.5"
                  onClick={() => {
                    if (confirmDeleteTemplateId === t.id) {
                      clearTemplateTimer();
                      setConfirmDeleteTemplateId(null);
                      deleteTemplate(t.id);
                    } else {
                      clearTemplateTimer();
                      setConfirmDeleteTemplateId(t.id);
                      confirmTemplateTimerRef.current = setTimeout(() => {
                        setConfirmDeleteTemplateId(null);
                      }, 3000);
                    }
                  }}
                  title={
                    confirmDeleteTemplateId === t.id
                      ? "Confirm delete template"
                      : "Delete template"
                  }
                  aria-label={
                    confirmDeleteTemplateId === t.id
                      ? `Confirm delete template ${t.name}`
                      : `Delete template ${t.name}`
                  }
                >
                  {confirmDeleteTemplateId === t.id ? "?" : "×"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
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
      ) : filtered.length === 0 ? (
        <div className="mt-4 flex flex-col items-start gap-2">
          <p className="typography-body-sm text-muted">
            No encounters match your search.
          </p>
          <button
            className="admin-button-secondary typography-body-sm px-3 py-1"
            onClick={() => setSearchQuery("")}
          >
            Clear search
          </button>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {filtered.map((e) => {
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
                    className="admin-button-danger typography-body-sm px-3 py-1"
                    onClick={() => {
                      if (confirmDeleteEncounterId === e.id) {
                        clearEncounterTimer();
                        setConfirmDeleteEncounterId(null);
                        deleteEncounter(e.id);
                      } else {
                        clearEncounterTimer();
                        setConfirmDeleteEncounterId(e.id);
                        confirmEncounterTimerRef.current = setTimeout(() => {
                          setConfirmDeleteEncounterId(null);
                        }, 3000);
                      }
                    }}
                  >
                    {confirmDeleteEncounterId === e.id ? "Confirm?" : "Delete"}
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
