"use client";

import { useEffect, useRef, useState } from "react";

import type { InitiativeRow as RowData } from "@/page/encounters/utils/initiativeOrder";

type Props = {
  row: RowData;
  currentHp?: number;
  maxHp?: number;
  isActive: boolean;
  onAdjustHp?: (delta: number) => void;
  onSetHp?: (value: number) => void;
};

export function CondensedInitiativeRow({
  row,
  currentHp,
  maxHp,
  isActive,
  onAdjustHp,
  onSetHp,
}: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [setHpValue, setSetHpValue] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const hasHp =
    currentHp !== undefined &&
    maxHp !== undefined &&
    onAdjustHp !== undefined &&
    onSetHp !== undefined;

  const hpPercent =
    hasHp && maxHp! > 0
      ? Math.max(0, Math.min(100, (currentHp! / maxHp!) * 100))
      : 0;

  let hpColor: string;
  if (!hasHp || currentHp! <= 0) {
    hpColor = "var(--color-text-muted)";
  } else if (hpPercent <= 25) {
    hpColor = "var(--color-danger)";
  } else if (hpPercent <= 50) {
    hpColor = "var(--color-accent)";
  } else {
    hpColor = "#4a9e6b";
  }

  useEffect(() => {
    if (!popoverOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPopoverOpen(false);
      }
    }

    function handleClickOutside(e: MouseEvent) {
      const target = e.target instanceof Node ? e.target : null;
      if (
        target !== null &&
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setPopoverOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popoverOpen]);

  function handleSetHp() {
    if (!onSetHp) return;
    const parsed = Number.parseInt(setHpValue, 10);
    if (!Number.isFinite(parsed)) return;
    onSetHp(parsed);
    setSetHpValue("");
    setPopoverOpen(false);
  }

  return (
    <li
      className="relative flex items-center gap-2 rounded-md border px-2 py-1"
      style={{
        borderColor: isActive
          ? "var(--color-accent)"
          : "var(--color-border-subtle)",
      }}
      aria-current={isActive ? "true" : undefined}
    >
      {/* Active indicator bar */}
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: "0.2rem",
          height: "1rem",
          background: isActive
            ? "var(--color-accent)"
            : "var(--color-border-strong)",
          borderRadius: "999px",
          flexShrink: 0,
        }}
      />

      {/* Name - truncated */}
      <span className="typography-body-sm flex-1 truncate">{row.name}</span>

      {/* HP bar (clickable) - only if HP exists */}
      {hasHp && (
        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setPopoverOpen(!popoverOpen)}
            aria-label={`HP: ${currentHp} / ${maxHp}. Click to edit.`}
            style={{
              position: "relative",
              width: "3rem",
              height: "0.5rem",
              background: "var(--color-border-subtle)",
              borderRadius: "999px",
              overflow: "hidden",
              cursor: "pointer",
              border: "none",
              padding: 0,
              display: "block",
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: 0,
                width: `${hpPercent}%`,
                background: hpColor,
                borderRadius: "999px",
                transition: "width 0.2s ease, background 0.2s ease",
              }}
            />
          </button>

          {/* HP Popover */}
          {popoverOpen && (
            <div
              ref={popoverRef}
              style={{
                position: "absolute",
                top: "calc(100% + 0.5rem)",
                right: 0,
                zIndex: 50,
                minWidth: "13rem",
                background: "var(--color-surface-card)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: "0.5rem",
                padding: "0.75rem",
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              }}
            >
              {/* HP display */}
              <div
                className="typography-body-sm"
                style={{
                  fontVariantNumeric: "tabular-nums",
                  color:
                    currentHp! <= 0
                      ? "var(--color-danger)"
                      : "var(--color-text-primary)",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                }}
              >
                {currentHp} / {maxHp} HP
              </div>

              {/* Quick adjust buttons */}
              <div
                className="flex flex-wrap gap-1"
                style={{ marginBottom: "0.5rem" }}
              >
                {([-10, -5, -1, +1, +5, +10] as const).map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    className="admin-button-secondary typography-body-sm px-2 py-0.5"
                    style={
                      delta < 0
                        ? { color: "var(--color-danger)" }
                        : { color: "#4a9e6b" }
                    }
                    onClick={() => {
                      onAdjustHp!(delta);
                    }}
                    aria-label={`${delta > 0 ? "+" : ""}${delta} HP`}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </button>
                ))}
              </div>

              {/* Set HP input */}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  inputMode="numeric"
                  className="input-field typography-body-sm w-16 px-2 py-1"
                  value={setHpValue}
                  onChange={(e) => setSetHpValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSetHp();
                  }}
                  placeholder="Set HP"
                  aria-label="Set HP to value"
                />
                <button
                  type="button"
                  className="admin-button-secondary typography-body-sm px-2 py-1"
                  onClick={handleSetHp}
                  disabled={!setHpValue}
                >
                  Set
                </button>
                <button
                  type="button"
                  className="admin-button-secondary typography-body-sm px-2 py-1"
                  style={{ color: "#4a9e6b" }}
                  onClick={() => {
                    onSetHp!(maxHp!);
                    setPopoverOpen(false);
                  }}
                  aria-label="Full heal"
                >
                  Full
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initiative value */}
      <span
        className="typography-body-sm text-muted"
        style={{
          fontVariantNumeric: "tabular-nums",
          minWidth: "1.5rem",
          textAlign: "right",
        }}
      >
        {row.initiative ?? "—"}
      </span>
    </li>
  );
}
