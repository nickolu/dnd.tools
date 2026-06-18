"use client";

import { useCallback, useState } from "react";

const STORAGE_KEY = "dnd.tools:encounter:widget-order";

type WidgetId = "party" | "monsters" | "balance" | "combatants";

const DEFAULT_ORDER: WidgetId[] = [
  "party",
  "monsters",
  "balance",
  "combatants",
];

function readOrder(): WidgetId[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ORDER;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== DEFAULT_ORDER.length)
      return DEFAULT_ORDER;
    // Validate all IDs are present
    const set = new Set(parsed);
    if (DEFAULT_ORDER.some((id) => !set.has(id))) return DEFAULT_ORDER;
    return parsed;
  } catch {
    return DEFAULT_ORDER;
  }
}

export function useWidgetOrder() {
  const [order, setOrder] = useState<WidgetId[]>(readOrder);

  const moveUp = useCallback((id: WidgetId) => {
    setOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx <= 0) return prev;
      const next = prev
        .slice(0, idx - 1)
        .concat([id])
        .concat(prev.slice(idx - 1, idx))
        .concat(prev.slice(idx + 1));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const moveDown = useCallback((id: WidgetId) => {
    setOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = prev
        .slice(0, idx)
        .concat(prev.slice(idx + 1, idx + 2))
        .concat([id])
        .concat(prev.slice(idx + 2));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setOrder((prev) => {
      if (fromIndex === toIndex) return prev;
      const next = [...prev];
      const spliced = next.splice(fromIndex, 1);
      const moved = spliced[0];
      if (moved === undefined) return prev;
      next.splice(toIndex, 0, moved);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetOrder = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setOrder(DEFAULT_ORDER);
  }, []);

  return { order, moveUp, moveDown, reorder, resetOrder };
}

export type { WidgetId };
