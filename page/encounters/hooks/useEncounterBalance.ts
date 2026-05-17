"use client";

import { useMemo } from "react";

import { computeBalance } from "@/lib/domain/encounter/cr2/computeBalance";
import type { BalanceResult } from "@/lib/domain/encounter/cr2/types";
import type { Encounter } from "@/lib/domain/encounter/encounter.schema";

export function useEncounterBalance(encounter: Encounter): BalanceResult {
  return useMemo(() => computeBalance(encounter), [encounter]);
}
