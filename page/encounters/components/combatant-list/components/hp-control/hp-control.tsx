"use client";

import { type KeyboardEvent, useEffect, useState } from "react";

type Props = {
  currentHp: number;
  maxHp: number;
  onAdjust: (delta: number) => void;
  onSet: (value: number) => void;
};

export function HpControl({ currentHp, maxHp, onAdjust, onSet }: Props) {
  const [inputValue, setInputValue] = useState(String(currentHp));
  const [amount, setAmount] = useState("");

  useEffect(() => {
    setInputValue(String(currentHp));
  }, [currentHp]);

  function commit() {
    const parsed = Number.parseInt(inputValue, 10);
    if (!Number.isFinite(parsed)) {
      setInputValue(String(currentHp));
      return;
    }
    onSet(parsed);
  }

  function applyDamageHeal(sign: 1 | -1) {
    const parsed = Number.parseInt(amount, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onAdjust(sign * parsed);
    setAmount("");
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setInputValue(String(currentHp));
      e.currentTarget.blur();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onAdjust(e.shiftKey ? 10 : 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onAdjust(-(e.shiftKey ? 10 : 1));
    }
  }

  const downed = currentHp <= 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={() => onAdjust(-10)}
          aria-label="Damage 10"
        >
          -10
        </button>
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={() => onAdjust(-1)}
          aria-label="Damage 1"
        >
          -1
        </button>
        <input
          type="number"
          inputMode="numeric"
          className="input-field typography-body-sm w-16 px-2 py-1 text-right"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          aria-label="Current HP"
          style={downed ? { color: "var(--color-text-muted)" } : undefined}
        />
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={() => onAdjust(+1)}
          aria-label="Heal 1"
        >
          +1
        </button>
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={() => onAdjust(+10)}
          aria-label="Heal 10"
        >
          +10
        </button>
        <span className="typography-body-sm text-muted ml-1">/ {maxHp}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          className="input-field typography-body-sm w-16 px-2 py-1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          aria-label="Damage or heal amount"
        />
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={() => applyDamageHeal(-1)}
          disabled={!amount}
        >
          Damage
        </button>
        <button
          type="button"
          className="admin-button-secondary typography-body-sm px-2 py-1"
          onClick={() => applyDamageHeal(+1)}
          disabled={!amount}
        >
          Heal
        </button>
      </div>
    </div>
  );
}
