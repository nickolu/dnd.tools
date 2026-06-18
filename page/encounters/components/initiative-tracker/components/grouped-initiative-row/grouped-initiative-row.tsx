"use client";

import { useMemo, useState } from "react";

import {
  type Condition,
  CONDITIONS,
} from "@/lib/domain/encounter/encounter.schema";
import type { InitiativeGroup } from "@/page/encounters/utils/initiativeOrder";

import { HpControl } from "../../../combatant-list/components/hp-control";
import { ConditionBadges } from "../condition-badges";

type Props = {
  group: InitiativeGroup;
  encounterId: string;
  isActive: boolean;
  onSetInitiative: (value: number | null) => void;
  onRoll: () => void;
  onAddToGroup: () => void;
  onAdjustHp: (combatantId: string, delta: number) => void;
  onSetHp: (combatantId: string, value: number) => void;
  rollingDisplay?: number | null;
  hasMap?: boolean;
  onPlaceOnMap?: (combatantId: string) => void;
  onRemoveFromMap?: (combatantId: string) => void;
  onMapCombatantIds?: Set<string>;
  pendingPlaceCombatantId?: string | null;
  conditions?: Record<string, Condition[]>;
  onToggleCondition?: (combatantId: string, condition: Condition) => void;
  onClearConditions?: (combatantId: string) => void;
  onToggleGroupCondition?: (condition: Condition) => void;
  onClearGroupConditions?: () => void;
};

export function GroupedInitiativeRow({
  group,
  isActive,
  onSetInitiative,
  onRoll,
  onAddToGroup,
  onAdjustHp,
  onSetHp,
  rollingDisplay,
  hasMap,
  onPlaceOnMap,
  onRemoveFromMap,
  onMapCombatantIds,
  pendingPlaceCombatantId,
  conditions,
  onToggleCondition,
  onClearConditions,
  onToggleGroupCondition,
  onClearGroupConditions,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const { combatants } = group;

  const groupConditions = useMemo(() => {
    if (combatants.length === 0) return [];
    return CONDITIONS.filter((cond) =>
      combatants.every((c) => (conditions?.[c.id] ?? []).includes(cond))
    );
  }, [combatants, conditions]);
  const totalMaxHp = combatants.reduce((sum, c) => sum + c.maxHp, 0);
  const totalCurrentHp = combatants.reduce((sum, c) => sum + c.currentHp, 0);
  const hpPercent =
    totalMaxHp > 0
      ? Math.max(0, Math.min(100, (totalCurrentHp / totalMaxHp) * 100))
      : 0;

  let hpColor: string;
  if (totalCurrentHp <= 0) {
    hpColor = "var(--color-text-muted)";
  } else if (hpPercent <= 25) {
    hpColor = "var(--color-danger)";
  } else if (hpPercent <= 50) {
    hpColor = "var(--color-accent)";
  } else {
    hpColor = "#4a9e6b";
  }

  const initiativeValue =
    group.initiative === null ? "" : String(group.initiative);
  const showAnimated = rollingDisplay !== undefined && rollingDisplay !== null;
  const sideLabel = group.side === "enemy" ? "Enemy" : "Ally";

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
      {/* Header row */}
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
        <span className="typography-body flex-1">
          {group.name} &times; {combatants.length}
        </span>
        <span className="typography-body-sm text-muted">{sideLabel}</span>

        {/* Aggregate HP bar */}
        <div
          style={{
            width: "3rem",
            height: "0.5rem",
            background: "var(--color-border-subtle)",
            borderRadius: "999px",
            overflow: "hidden",
          }}
          title={`HP: ${totalCurrentHp} / ${totalMaxHp}`}
        >
          <div
            style={{
              width: `${hpPercent}%`,
              height: "100%",
              background: hpColor,
              borderRadius: "999px",
              transition: "width 0.2s ease, background 0.2s ease",
            }}
          />
        </div>

        {/* Expand/collapse toggle */}
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Collapse group" : "Expand group"}
          aria-expanded={expanded}
        >
          {expanded ? "\u25B2" : "\u25BC"}
        </button>
      </div>

      {/* Initiative controls */}
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-1">
          <span className="typography-kicker text-muted">Init</span>
          {showAnimated ? (
            <span
              className="typography-body-sm text-right"
              style={{
                display: "inline-block",
                width: "4rem",
                fontVariantNumeric: "tabular-nums",
                color: "var(--color-accent)",
                fontWeight: "bold",
                textAlign: "center",
              }}
              aria-live="polite"
              aria-label={`Rolling initiative for ${group.name}`}
            >
              {rollingDisplay}
            </span>
          ) : (
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
              aria-label={`Initiative for ${group.name}`}
            />
          )}
        </div>
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={() =>
            onSetInitiative(
              group.initiative === null ? 0 : group.initiative - 1
            )
          }
          aria-label="Decrease initiative"
        >
          &minus;
        </button>
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={() =>
            onSetInitiative(
              group.initiative === null ? 0 : group.initiative + 1
            )
          }
          aria-label="Increase initiative"
        >
          +
        </button>
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={onRoll}
          aria-label={`Roll initiative for ${group.name}`}
        >
          Roll
        </button>
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={onAddToGroup}
          aria-label={`Add another ${group.name} to group`}
          title="Add to group"
        >
          +1
        </button>
        <span className="typography-body-sm text-muted ml-auto">
          Mod {group.dexMod >= 0 ? `+${group.dexMod}` : group.dexMod}
        </span>
      </div>

      {/* Group-level condition bar */}
      {expanded && onToggleGroupCondition && onClearGroupConditions && (
        <div className="flex flex-col gap-1 pl-4">
          <span className="typography-kicker text-muted">Apply to all:</span>
          <ConditionBadges
            conditions={groupConditions}
            onToggle={onToggleGroupCondition}
            onClear={onClearGroupConditions}
          />
        </div>
      )}

      {/* Expanded individual combatant rows */}
      {expanded && (
        <ul className="flex flex-col gap-1.5 pl-4">
          {combatants.map((combatant, idx) => {
            const isOnMap = onMapCombatantIds?.has(combatant.id) ?? false;
            const isPending = pendingPlaceCombatantId === combatant.id;
            const isDowned = combatant.currentHp === 0;
            const combatantConditions = conditions?.[combatant.id] ?? [];

            return (
              <li
                key={combatant.id}
                className="flex flex-col gap-1 rounded border px-2 py-1"
                style={{
                  borderColor: "var(--color-border-subtle)",
                  opacity: isDowned ? 0.5 : 1,
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="typography-body-sm flex-1"
                    style={{
                      textDecoration: isDowned ? "line-through" : undefined,
                      color: isDowned ? "var(--color-text-muted)" : undefined,
                    }}
                  >
                    {combatant.nameOverride ?? `${group.name} ${idx + 1}`}
                  </span>
                  {isDowned && (
                    <span
                      className="typography-kicker"
                      style={{ color: "var(--color-danger)" }}
                    >
                      Down
                    </span>
                  )}
                  {isOnMap ? (
                    <button
                      type="button"
                      className="typography-kicker"
                      style={{
                        background:
                          "color-mix(in srgb, var(--color-focus-ring) 15%, transparent)",
                        color: "var(--color-focus-ring)",
                        border:
                          "1px solid color-mix(in srgb, var(--color-focus-ring) 30%, transparent)",
                        borderRadius: "999px",
                        padding: "0.1rem 0.4rem",
                        cursor: onRemoveFromMap ? "pointer" : "default",
                        fontSize: "0.625rem",
                      }}
                      title="On map — click to remove"
                      onClick={() => onRemoveFromMap?.(combatant.id)}
                      aria-label="Remove from map"
                    >
                      On map
                    </button>
                  ) : hasMap ? (
                    <button
                      type="button"
                      className="filter-chip"
                      style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}
                      data-active={isPending}
                      aria-pressed={isPending}
                      onClick={() => onPlaceOnMap?.(combatant.id)}
                    >
                      {isPending ? "Placing\u2026" : "Place"}
                    </button>
                  ) : null}
                </div>

                <HpControl
                  currentHp={combatant.currentHp}
                  maxHp={combatant.maxHp}
                  onAdjust={(delta) => onAdjustHp(combatant.id, delta)}
                  onSet={(value) => onSetHp(combatant.id, value)}
                />

                {onToggleCondition && onClearConditions && (
                  <ConditionBadges
                    conditions={combatantConditions}
                    onToggle={(condition) =>
                      onToggleCondition(combatant.id, condition)
                    }
                    onClear={() => onClearConditions(combatant.id)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
