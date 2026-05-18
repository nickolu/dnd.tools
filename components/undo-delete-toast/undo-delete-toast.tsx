"use client";

import { useEncounterLibraryStore } from "@/lib/store/useEncounterLibraryStore";

export function UndoDeleteToast() {
  const pendingDelete = useEncounterLibraryStore((s) => s.pendingDelete);
  const undoDelete = useEncounterLibraryStore((s) => s.undoDelete);

  if (!pendingDelete) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg"
      style={{
        background: "var(--color-surface-elevated)",
        border: "1px solid var(--color-border-strong)",
      }}
      role="alert"
    >
      <p
        className="typography-body-sm"
        style={{ color: "var(--color-text-primary)" }}
      >
        Encounter &ldquo;{pendingDelete.encounter.name}&rdquo; deleted.
      </p>
      <button
        type="button"
        className="admin-button-secondary typography-body-sm px-3 py-1"
        onClick={undoDelete}
      >
        Undo
      </button>
    </div>
  );
}
