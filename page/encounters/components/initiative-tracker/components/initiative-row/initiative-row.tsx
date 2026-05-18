"use client";

import Link from "next/link";

import type { Condition } from "@/lib/domain/encounter/encounter.schema";
import type { InitiativeRow as RowData } from "@/page/encounters/utils/initiativeOrder";

import { HpControl } from "../../../combatant-list/components/hp-control";
import { ConditionBadges } from "../condition-badges";

type Props = {
  row: RowData;
  currentHp?: number;
  maxHp?: number;
  monsterId?: string;
  onAdjustHp?: (delta: number) => void;
  onSetHp?: (value: number) => void;
  isActive: boolean;
  // For PC rows we additionally surface initiativeMod for the user to edit.
  editableMod?: boolean;
  onSetInitiative: (value: number | null) => void;
  onSetMod?: (mod: number) => void;
  onRoll: () => void;
  conditions?: Condition[];
  onToggleCondition?: (condition: Condition) => void;
  onClearConditions?: () => void;
};

export function InitiativeRow({
  row,
  currentHp,
  maxHp,
  monsterId,
  onAdjustHp,
  onSetHp,
  isActive,
  editableMod,
  onSetInitiative,
  onSetMod,
  onRoll,
  conditions,
  onToggleCondition,
  onClearConditions,
}: Props) {
  const initiativeValue = row.initiative === null ? "" : String(row.initiative);
  const modValue = String(row.dexMod);
  const sideLabel = row.side === "enemy" ? "Enemy" : "Ally";

  const hasHpControl =
    currentHp !== undefined &&
    maxHp !== undefined &&
    onAdjustHp !== undefined &&
    onSetHp !== undefined;

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
        {monsterId ? (
          <Link
            href={`/monsters/${monsterId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="typography-body flex-1 hover:underline"
            style={{ textDecoration: "none" }}
          >
            {row.name}
          </Link>
        ) : (
          <span className="typography-body flex-1">{row.name}</span>
        )}
        <span className="typography-body-sm text-muted">{sideLabel}</span>
      </div>
      {conditions !== undefined &&
        onToggleCondition !== undefined &&
        onClearConditions !== undefined && (
          <ConditionBadges
            conditions={conditions}
            onToggle={onToggleCondition}
            onClear={onClearConditions}
          />
        )}
      {hasHpControl && (
        <HpControl
          currentHp={currentHp}
          maxHp={maxHp}
          onAdjust={onAdjustHp}
          onSet={onSetHp}
        />
      )}
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
