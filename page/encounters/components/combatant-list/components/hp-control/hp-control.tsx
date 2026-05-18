"use client";

import { type KeyboardEvent, useState } from "react";

type Props = {
  currentHp: number;
  maxHp: number;
  onAdjust: (delta: number) => void;
  onSet: (value: number) => void;
};

export function HpControl({ currentHp, maxHp, onAdjust, onSet }: Props) {
  const [amount, setAmount] = useState("");

  const downed = currentHp <= 0;
  const bloodied = currentHp > 0 && currentHp <= maxHp / 2;

  const hpPercent =
    maxHp > 0 ? Math.max(0, Math.min(100, (currentHp / maxHp) * 100)) : 0;

  let barColor: string;
  if (downed) {
    barColor = "var(--color-text-muted)";
  } else if (hpPercent <= 25) {
    barColor = "var(--color-danger)";
  } else if (hpPercent <= 50) {
    barColor = "var(--color-accent)";
  } else {
    barColor = "#4a9e6b";
  }

  function applyDamageHeal(sign: 1 | -1) {
    const parsed = Number.parseInt(amount, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onAdjust(sign * parsed);
    setAmount("");
  }

  function handleAmountKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      applyDamageHeal(-1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onAdjust(e.shiftKey ? 10 : 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onAdjust(-(e.shiftKey ? 10 : 1));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* HP display row */}
      <div className="flex items-center gap-2">
        <span
          className="typography-body-sm"
          aria-label="Current HP"
          style={{
            color: downed ? "var(--color-danger)" : "var(--color-text-primary)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {currentHp} / {maxHp}
        </span>
        {downed && (
          <span
            className="typography-kicker"
            style={{
              color: "var(--color-danger)",
              background: "rgba(178, 84, 80, 0.15)",
              border: "1px solid rgba(178, 84, 80, 0.3)",
              borderRadius: "999px",
              padding: "0.1rem 0.45rem",
            }}
          >
            Downed
          </span>
        )}
        {bloodied && (
          <span
            className="typography-kicker"
            style={{
              color: "var(--color-accent)",
              background: "rgba(212, 160, 65, 0.15)",
              border: "1px solid rgba(212, 160, 65, 0.3)",
              borderRadius: "999px",
              padding: "0.1rem 0.45rem",
            }}
          >
            Bloodied
          </span>
        )}
      </div>

      {/* HP bar */}
      <div
        style={{
          height: "0.35rem",
          borderRadius: "999px",
          background: "var(--color-border-subtle)",
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        <div
          style={{
            height: "100%",
            width: `${hpPercent}%`,
            background: barColor,
            borderRadius: "999px",
            transition: "width 0.2s ease, background 0.2s ease",
          }}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          className="input-field typography-body-sm w-16 px-2 py-1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleAmountKey}
          placeholder="0"
          aria-label="Damage or heal amount"
        />
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={() => applyDamageHeal(-1)}
          disabled={!amount}
          style={amount ? { color: "var(--color-danger)" } : undefined}
          aria-label="Apply damage"
        >
          Damage
        </button>
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={() => applyDamageHeal(+1)}
          disabled={!amount}
          style={amount ? { color: "var(--color-accent)" } : undefined}
          aria-label="Apply heal"
        >
          Heal
        </button>
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={() => onSet(maxHp)}
          aria-label="Full heal"
          style={{ color: "var(--color-accent)" }}
        >
          Full Heal
        </button>
      </div>
    </div>
  );
}
