"use client";

import { useSyncExternalStore } from "react";

import { useEncounterLibraryStore } from "./useEncounterLibraryStore";

function subscribe(onChange: () => void): () => void {
  const unsubHydrate = useEncounterLibraryStore.persist.onHydrate(onChange);
  const unsubFinish =
    useEncounterLibraryStore.persist.onFinishHydration(onChange);
  return () => {
    unsubHydrate();
    unsubFinish();
  };
}

function getSnapshot(): boolean {
  return useEncounterLibraryStore.persist.hasHydrated();
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Tracks whether the persisted encounter library has finished hydrating from
 * IndexedDB. Use to gate UI that depends on a specific encounter existing
 * (e.g. the editor's "not found" message — we don't want to flash it while
 * IDB is still loading).
 */
export function useEncountersHasHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
