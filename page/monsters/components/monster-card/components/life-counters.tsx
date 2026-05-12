"use client";

import { useEffect, useState } from "react";

interface LifeCountersProps {
  monsterId: string;
  maxHp: number;
}

function getStorageKey(monsterId: string): string {
  return `dnd-life-counters-${monsterId}`;
}

function loadCounters(monsterId: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(monsterId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v) => typeof v === "number" && Number.isFinite(v));
  } catch {
    return [];
  }
}

function saveCounters(monsterId: string, counters: number[]): void {
  try {
    localStorage.setItem(getStorageKey(monsterId), JSON.stringify(counters));
  } catch {
    // ignore storage errors
  }
}

function getHpColor(current: number, max: number): string {
  if (max === 0) return "";
  const ratio = current / max;
  if (ratio <= 0.25) return "text-red-400";
  if (ratio <= 0.5) return "text-yellow-400";
  return "";
}

export function LifeCounters({ monsterId, maxHp }: LifeCountersProps) {
  const [counters, setCounters] = useState<number[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  useEffect(() => {
    setCounters(loadCounters(monsterId));
  }, [monsterId]);

  function update(next: number[]) {
    setCounters(next);
    saveCounters(monsterId, next);
  }

  function addCounter() {
    if (counters.length >= 10) return;
    update([...counters, maxHp]);
  }

  function removeCounter(index: number) {
    update(counters.filter((_, i) => i !== index));
  }

  function adjustHp(index: number, delta: number) {
    update(
      counters.map((hp, i) =>
        i === index ? Math.max(0, Math.min(maxHp, hp + delta)) : hp
      )
    );
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditValue(String(counters[index]));
  }

  function commitEdit(index: number) {
    const parsed = parseInt(editValue, 10);
    if (Number.isFinite(parsed)) {
      update(
        counters.map((hp, i) =>
          i === index ? Math.max(0, Math.min(maxHp, parsed)) : hp
        )
      );
    }
    setEditingIndex(null);
    setEditValue("");
  }

  return (
    <div className="mt-1">
      <p className="typography-body-sm text-muted mb-1.5">Life Counters</p>
      {counters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {counters.map((hp, index) => (
            <div
              key={index}
              className="flex items-center gap-0.5 rounded-[var(--radius-sm)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-1.5 py-1"
            >
              <button
                aria-label={`Remove counter ${index + 1}`}
                className="flex h-4 w-4 items-center justify-center rounded text-muted hover:text-text-primary transition-colors text-xs leading-none"
                onClick={() => removeCounter(index)}
                title="Remove counter"
                type="button"
              >
                ×
              </button>
              <button
                aria-label={`Decrease HP for counter ${index + 1}`}
                className="flex h-5 w-5 items-center justify-center rounded text-secondary hover:text-text-primary transition-colors text-sm leading-none"
                onClick={() => adjustHp(index, -1)}
                title="Decrease HP"
                type="button"
              >
                −
              </button>
              {editingIndex === index ? (
                <input
                  aria-label={`HP value for counter ${index + 1}`}
                  autoFocus
                  className="w-10 bg-transparent text-center text-xs outline-none"
                  inputMode="numeric"
                  onBlur={() => commitEdit(index)}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") {
                      commitEdit(index);
                    }
                  }}
                  value={editValue}
                />
              ) : (
                <button
                  aria-label={`Edit HP for counter ${index + 1}, currently ${hp} of ${maxHp}`}
                  className={`typography-body-sm w-10 text-center tabular-nums transition-colors hover:text-accent ${getHpColor(hp, maxHp)}`}
                  onClick={() => startEdit(index)}
                  title="Click to edit HP"
                  type="button"
                >
                  {hp}/{maxHp}
                </button>
              )}
              <button
                aria-label={`Increase HP for counter ${index + 1}`}
                className="flex h-5 w-5 items-center justify-center rounded text-secondary hover:text-text-primary transition-colors text-sm leading-none"
                onClick={() => adjustHp(index, 1)}
                title="Increase HP"
                type="button"
              >
                +
              </button>
            </div>
          ))}
        </div>
      )}
      {counters.length < 10 && (
        <button
          className="typography-body-sm inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[color:var(--color-border-subtle)] px-2 py-1 text-secondary transition-colors hover:text-text-primary hover:border-[color:var(--color-border-strong)]"
          onClick={addCounter}
          title="Add life counter"
          type="button"
        >
          <span aria-hidden="true">+</span> Add
        </button>
      )}
    </div>
  );
}
