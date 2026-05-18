"use client";

import { useCallback, useRef, useState } from "react";

type RollingState = Record<string, number | null>; // id -> animated value (null = not rolling)

export function useRollAnimation() {
  const [rolling, setRolling] = useState<RollingState>({});
  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(
    new Map()
  );

  const animateRoll = useCallback((ids: string[]) => {
    // Start animation for each ID
    for (const id of ids) {
      // Clear any existing animation
      const existing = intervalsRef.current.get(id);
      if (existing) clearInterval(existing);

      // Shuffle random numbers for ~600ms
      const interval = setInterval(() => {
        setRolling((prev) => ({
          ...prev,
          [id]: Math.floor(Math.random() * 20) + 1,
        }));
      }, 50);

      intervalsRef.current.set(id, interval);

      // Stop after 600ms, remove animated overlay
      setTimeout(() => {
        clearInterval(interval);
        intervalsRef.current.delete(id);
        setRolling((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 600);
    }
  }, []);

  const isRolling = useCallback((id: string) => id in rolling, [rolling]);
  const displayValue = useCallback(
    (id: string) => rolling[id] ?? null,
    [rolling]
  );

  return { animateRoll, isRolling, displayValue };
}
