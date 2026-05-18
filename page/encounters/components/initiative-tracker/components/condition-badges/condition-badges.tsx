"use client";

import { useEffect, useRef, useState } from "react";

import {
  type Condition,
  CONDITIONS,
} from "@/lib/domain/encounter/encounter.schema";

const ABBREV: Record<string, string> = {
  blinded: "BLI",
  charmed: "CHR",
  deafened: "DEA",
  exhaustion: "EXH",
  frightened: "FRI",
  grappled: "GRA",
  incapacitated: "INC",
  invisible: "INV",
  paralyzed: "PAR",
  petrified: "PET",
  poisoned: "POI",
  prone: "PRO",
  restrained: "RES",
  stunned: "STU",
};

type Props = {
  conditions: Condition[];
  onToggle: (condition: Condition) => void;
  onClear: () => void;
};

export function ConditionBadges({ conditions, onToggle, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleDocumentClick(e: MouseEvent) {
      if (
        e.target instanceof Node &&
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.25rem",
      }}
    >
      {conditions.map((condition) => (
        <span
          key={condition}
          title={condition}
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0.125rem 0.375rem",
            borderRadius: "999px",
            fontSize: "0.625rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            background:
              "color-mix(in srgb, var(--color-accent) 20%, transparent)",
            color: "var(--color-accent)",
            border:
              "1px solid color-mix(in srgb, var(--color-accent) 40%, transparent)",
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={() => onToggle(condition)}
          role="button"
          tabIndex={0}
          aria-label={`Remove ${condition}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle(condition);
            }
          }}
        >
          {ABBREV[condition] ?? condition.slice(0, 3).toUpperCase()}
        </span>
      ))}

      <button
        type="button"
        aria-label="Toggle conditions"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "1.25rem",
          height: "1.25rem",
          borderRadius: "999px",
          border: "1px solid var(--color-border-subtle)",
          background: "transparent",
          cursor: "pointer",
          fontSize: "0.75rem",
          lineHeight: 1,
          color: "var(--color-text-muted)",
          padding: 0,
        }}
      >
        +
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: "0.5rem",
            padding: "0.5rem",
            minWidth: "10rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          {CONDITIONS.map((condition) => {
            const active = conditions.includes(condition);
            return (
              <label
                key={condition}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  padding: "0.125rem 0.25rem",
                  borderRadius: "0.25rem",
                  background: active
                    ? "color-mix(in srgb, var(--color-accent) 10%, transparent)"
                    : "transparent",
                }}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => onToggle(condition)}
                  style={{
                    cursor: "pointer",
                    accentColor: "var(--color-accent)",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "capitalize",
                    color: active ? "var(--color-accent)" : "var(--color-text)",
                  }}
                >
                  {condition}
                </span>
              </label>
            );
          })}
          <button
            type="button"
            onClick={() => {
              onClear();
              setOpen(false);
            }}
            style={{
              marginTop: "0.25rem",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.25rem",
              border: "1px solid var(--color-border-subtle)",
              background: "transparent",
              cursor: "pointer",
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              textAlign: "left",
            }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
