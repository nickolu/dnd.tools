"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { SearchInput } from "@/components/search-input";
import type { CombatantSide } from "@/lib/domain/encounter/encounter.schema";
import { useMonsters } from "@/lib/query/hooks/useMonsters";
import { useEncounterLibraryStore } from "@/lib/store/useEncounterLibraryStore";
import { formatCr } from "@/page/encounters/utils/formatPower";

const RESULT_CAP = 30;
const MAX_QUANTITY = 50;

type Props = {
  encounterId: string;
};

export function MonsterAddPanel({ encounterId }: Props) {
  const { data: monsters = [], isLoading, isError } = useMonsters();
  const addCombatant = useEncounterLibraryStore((s) => s.addCombatant);

  const [query, setQuery] = useState("");
  const [side, setSide] = useState<CombatantSide>("enemy");
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAdd = useCallback(
    (monsterName: string, monsterId: string) => {
      addCombatant(encounterId, {
        monster: monsters.find((m) => m.id === monsterId)!,
        side,
        quantity,
      });
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
      setAddedMessage(
        quantity > 1
          ? `Added ${quantity}× ${monsterName}`
          : `Added ${monsterName}`
      );
      addedTimerRef.current = setTimeout(() => setAddedMessage(null), 2000);
    },
    [addCombatant, encounterId, monsters, side, quantity]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return monsters.slice(0, RESULT_CAP);
    return monsters
      .filter((m) => m.nameNormalized.includes(q))
      .slice(0, RESULT_CAP);
  }, [monsters, query]);

  return (
    <section className="surface-card flex flex-col gap-3 p-4">
      <h2 className="typography-h2">Add monsters</h2>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          wrapperClassName="relative min-w-[12rem] flex-1"
          className="input-field typography-body-sm w-full px-2 py-1 pr-7"
          placeholder="Search monsters..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery("")}
          aria-label="Search monsters"
        />
        <div className="flex gap-1" role="group" aria-label="Side">
          {(["enemy", "ally"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className="filter-chip"
              data-active={value === side}
              onClick={() => setSide(value)}
              aria-pressed={value === side}
            >
              {value === "enemy" ? "Enemy" : "Ally"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5">
          <span className="typography-kicker text-muted">Qty</span>
          <input
            type="number"
            min={1}
            max={MAX_QUANTITY}
            className="input-field typography-body-sm w-14 px-2 py-1"
            value={quantity}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              setQuantity(
                Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_QUANTITY) : 1
              );
            }}
          />
        </label>
      </div>
      {addedMessage ? (
        <p
          className="typography-body-sm"
          style={{ color: "var(--color-accent)" }}
        >
          {addedMessage}
        </p>
      ) : null}
      {isError ? (
        <p className="typography-body-sm text-secondary">
          Failed to load monsters.
        </p>
      ) : isLoading ? (
        <div className="flex flex-col gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 animate-pulse rounded-md"
              style={{ background: "var(--color-border-subtle)" }}
            />
          ))}
        </div>
      ) : (
        <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
          {results.length === 0 ? (
            <li className="typography-body-sm text-muted">
              No monsters match.
            </li>
          ) : (
            results.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className="admin-button-secondary typography-body-sm flex w-full items-baseline justify-between gap-2 px-2 py-1 text-left"
                  onClick={() => handleAdd(m.name, m.id)}
                >
                  <span>{m.name}</span>
                  <span className="text-muted">CR {formatCr(m.crNumeric)}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </section>
  );
}
