"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { Combatant } from "@/lib/domain/encounter/encounter.schema";
import { useEncounterLibraryStore } from "@/lib/store/useEncounterLibraryStore";

import { HpControl } from "../hp-control";

type Props = {
  encounterId: string;
  combatant: Combatant;
  displayName: string;
  monsterId?: string;
};

export function CombatantRow({
  encounterId,
  combatant,
  displayName,
  monsterId,
}: Props) {
  const adjustHp = useEncounterLibraryStore((s) => s.adjustHp);
  const setHp = useEncounterLibraryStore((s) => s.setHp);
  const removeCombatant = useEncounterLibraryStore((s) => s.removeCombatant);
  const updateCombatantName = useEncounterLibraryStore(
    (s) => s.updateCombatantName
  );

  const [editingName, setEditingName] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const downed = combatant.currentHp <= 0;
  const bloodied =
    combatant.currentHp > 0 && combatant.currentHp <= combatant.maxHp / 2;

  function commitName() {
    setEditingName(false);
    const trimmed = draft.trim();
    if (!trimmed || trimmed === displayName) {
      return;
    }
    updateCombatantName(encounterId, combatant.id, trimmed);
  }

  function handleRemoveClick() {
    if (confirmRemove) {
      clearConfirmTimer();
      removeCombatant(encounterId, combatant.id);
    } else {
      setConfirmRemove(true);
      confirmTimerRef.current = setTimeout(() => {
        setConfirmRemove(false);
      }, 3000);
    }
  }

  function clearConfirmTimer() {
    if (confirmTimerRef.current !== null) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
  }

  // Reset confirm state if user clicks elsewhere
  useEffect(() => {
    if (!confirmRemove) return;

    function handleDocumentClick(e: MouseEvent) {
      if (
        e.target instanceof Node &&
        removeButtonRef.current &&
        !removeButtonRef.current.contains(e.target)
      ) {
        clearConfirmTimer();
        setConfirmRemove(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [confirmRemove]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearConfirmTimer();
  }, []);

  const removeButtonRef = useRef<HTMLButtonElement>(null);

  let borderColor: string;
  if (downed) {
    borderColor = "rgba(178, 84, 80, 0.4)";
  } else if (bloodied) {
    borderColor = "rgba(212, 160, 65, 0.35)";
  } else {
    borderColor = "var(--color-border-subtle)";
  }

  let rowBackground: string | undefined;
  if (downed) {
    rowBackground = "rgba(178, 84, 80, 0.06)";
  } else {
    rowBackground = undefined;
  }

  return (
    <li
      className="flex flex-col gap-2 rounded-md border p-2"
      style={{
        borderColor,
        background: rowBackground,
        transition: "border-color 0.2s ease, background 0.2s ease",
      }}
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
          <div className="flex flex-1 items-center gap-1">
            <button
              type="button"
              className="typography-body-sm text-left hover:underline"
              onClick={() => {
                setDraft(displayName);
                setEditingName(true);
              }}
            >
              {displayName}
            </button>
            {monsterId && (
              <Link
                href={`/monsters/${monsterId}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${displayName} monster details`}
                style={{ color: "var(--color-text-muted)", lineHeight: 0 }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M7 1h4v4M11 1L5.5 6.5M4 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            )}
          </div>
        )}
        <button
          ref={removeButtonRef}
          type="button"
          className="admin-button-danger typography-body-sm px-2 py-1"
          onClick={handleRemoveClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" && confirmRemove) {
              clearConfirmTimer();
              removeCombatant(encounterId, combatant.id);
            }
          }}
          aria-label={
            confirmRemove
              ? `Confirm remove ${displayName}`
              : `Remove ${displayName}`
          }
        >
          {confirmRemove ? "Confirm?" : "Remove"}
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
