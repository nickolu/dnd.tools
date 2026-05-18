"use client";

import type { InitiativeRow as RowData } from "@/page/encounters/utils/initiativeOrder";

type Props = {
  row: RowData;
  hpDisplay?: string;
  isActive: boolean;
  // For PC rows we additionally surface initiativeMod for the user to edit.
  editableMod?: boolean;
  onSetInitiative: (value: number | null) => void;
  onSetMod?: (mod: number) => void;
  onRoll: () => void;
};

function parseHpStatus(hpDisplay: string): {
  downed: boolean;
  bloodied: boolean;
} {
  const parts = hpDisplay.split("/");
  if (parts.length !== 2) return { downed: false, bloodied: false };
  const currentStr = parts[0] ?? "";
  const maxStr = parts[1] ?? "";
  const current = Number.parseInt(currentStr, 10);
  const max = Number.parseInt(maxStr, 10);
  if (!Number.isFinite(current) || !Number.isFinite(max)) {
    return { downed: false, bloodied: false };
  }
  const downed = current <= 0;
  const bloodied = current > 0 && current <= max / 2;
  return { downed, bloodied };
}

export function InitiativeRow({
  row,
  hpDisplay,
  isActive,
  editableMod,
  onSetInitiative,
  onSetMod,
  onRoll,
}: Props) {
  const initiativeValue = row.initiative === null ? "" : String(row.initiative);
  const modValue = String(row.dexMod);
  const sideLabel = row.side === "enemy" ? "Enemy" : "Ally";

  let hpColor: string = "var(--color-text-muted)";
  let dotColor: string = "#4a9e6b";
  let hpStatusLabel = "healthy";

  if (hpDisplay) {
    const { downed, bloodied } = parseHpStatus(hpDisplay);
    if (downed) {
      hpColor = "var(--color-danger)";
      dotColor = "var(--color-danger)";
      hpStatusLabel = "downed";
    } else if (bloodied) {
      hpColor = "var(--color-accent)";
      dotColor = "var(--color-accent)";
      hpStatusLabel = "bloodied";
    } else {
      hpColor = "#4a9e6b";
      dotColor = "#4a9e6b";
      hpStatusLabel = "healthy";
    }
  }

  return (
    <li
      className="flex flex-col gap-2 rounded-md border p-2"
      style={{
        borderColor: isActive
          ? "var(--color-accent)"
          : "var(--color-border-subtle)",
      }}
      aria-current={isActive ? "true" : undefined}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: "0.25rem",
            height: "1.25rem",
            background: isActive
              ? "var(--color-accent)"
              : "var(--color-border-strong)",
            borderRadius: "999px",
          }}
        />
        <span className="typography-body flex-1">{row.name}</span>
        <span className="typography-body-sm text-muted">{sideLabel}</span>
        {hpDisplay ? (
          <span
            className="typography-body-sm"
            style={{
              color: hpColor,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <span
              aria-label={hpStatusLabel}
              style={{
                display: "inline-block",
                width: "0.45rem",
                height: "0.45rem",
                borderRadius: "50%",
                background: dotColor,
                flexShrink: 0,
              }}
            />
            HP {hpDisplay}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <label className="flex items-center gap-1">
          <span className="typography-kicker text-muted">Init</span>
          <input
            type="number"
            inputMode="numeric"
            className="input-field typography-body-sm w-16 px-2 py-1 text-right"
            value={initiativeValue}
            onChange={(e) => {
              const v = e.target.value;
              if (v.trim() === "") {
                onSetInitiative(null);
                return;
              }
              const parsed = Number.parseInt(v, 10);
              if (Number.isFinite(parsed)) onSetInitiative(parsed);
            }}
            aria-label={`Initiative for ${row.name}`}
          />
        </label>
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={() =>
            onSetInitiative(row.initiative === null ? 0 : row.initiative - 1)
          }
          aria-label="Decrease initiative"
        >
          −
        </button>
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={() =>
            onSetInitiative(row.initiative === null ? 0 : row.initiative + 1)
          }
          aria-label="Increase initiative"
        >
          +
        </button>
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={onRoll}
          aria-label={`Roll initiative for ${row.name}`}
        >
          Roll
        </button>
        {editableMod && onSetMod ? (
          <label className="ml-auto flex items-center gap-1">
            <span className="typography-kicker text-muted">Mod</span>
            <input
              type="number"
              inputMode="numeric"
              className="input-field typography-body-sm w-14 px-2 py-1 text-right"
              value={modValue}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                if (!Number.isFinite(parsed)) return;
                onSetMod(parsed);
              }}
              aria-label={`Initiative modifier for ${row.name}`}
              placeholder="0"
            />
          </label>
        ) : (
          <span className="typography-body-sm text-muted ml-auto">
            Mod {row.dexMod >= 0 ? `+${row.dexMod}` : row.dexMod}
          </span>
        )}
      </div>
    </li>
  );
}
