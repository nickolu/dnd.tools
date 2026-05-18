"use client";

import { useMemo } from "react";

import { computeBalance } from "@/lib/domain/encounter/cr2/computeBalance";
import type { BalanceResult } from "@/lib/domain/encounter/cr2/types";
import type { Encounter } from "@/lib/domain/encounter/encounter.schema";

export function useEncounterBalance(encounter: Encounter): {
  balance: BalanceResult;
  remainingBalance: BalanceResult | null;
} {
  const balance = useMemo(() => computeBalance(encounter), [encounter]);
  const remainingBalance = useMemo(
    () => computeBalance(encounter, { aliveOnly: true }),
    [encounter]
  );

  const hasDeadEnemies = encounter.combatants.some(
    (c) => c.side === "enemy" && c.currentHp <= 0
  );

  return {
    balance,
    remainingBalance: hasDeadEnemies ? remainingBalance : null,
  };
}
