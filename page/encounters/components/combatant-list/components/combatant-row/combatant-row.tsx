"use client";

import { useState } from "react";

import type { Combatant } from "@/lib/domain/encounter/encounter.schema";
import { useEncounterLibraryStore } from "@/lib/store/useEncounterLibraryStore";

import { HpControl } from "../hp-control";

type Props = {
  encounterId: string;
  combatant: Combatant;
  displayName: string;
};

export function CombatantRow({ encounterId, combatant, displayName }: Props) {
  const adjustHp = useEncounterLibraryStore((s) => s.adjustHp);
  const setHp = useEncounterLibraryStore((s) => s.setHp);
  const removeCombatant = useEncounterLibraryStore((s) => s.removeCombatant);
  const updateCombatantName = useEncounterLibraryStore(
    (s) => s.updateCombatantName
  );

  const [editingName, setEditingName] = useState(false);
  const [draft, setDraft] = useState(displayName);

  function commitName() {
    setEditingName(false);
    const trimmed = draft.trim();
    if (!trimmed || trimmed === displayName) {
      return;
    }
    updateCombatantName(encounterId, combatant.id, trimmed);
  }

  return (
    <li
      className="flex flex-col gap-2 rounded-md border p-2"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <div className="flex items-center gap-2">
        {editingName ? (
          <input
            className="input-field typography-body-sm flex-1 px-2 py-1"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              else if (e.key === "Escape") {
                setDraft(displayName);
                setEditingName(false);
              }
            }}
            aria-label="Edit combatant name"
          />
        ) : (
          <button
            type="button"
            className="typography-body-sm flex-1 text-left hover:underline"
            onClick={() => {
              setDraft(displayName);
              setEditingName(true);
            }}
          >
            {displayName}
          </button>
        )}
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={() => removeCombatant(encounterId, combatant.id)}
          aria-label={`Remove ${displayName}`}
        >
          Remove
        </button>
      </div>
      <HpControl
        currentHp={combatant.currentHp}
        maxHp={combatant.maxHp}
        onAdjust={(delta) => adjustHp(encounterId, combatant.id, delta)}
        onSet={(value) => setHp(encounterId, combatant.id, value)}
      />
    </li>
  );
}
