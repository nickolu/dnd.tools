import type { DifficultyBucket } from "@/lib/domain/encounter/cr2/types";

export type TipsCombatantInput = {
  monsterId: string;
  name: string;
  cr: string;
  size: string;
  type: string;
  count: number;
  keyTraits: string[];
};

export type TipsRequestPayload = {
  party: { size: number; levels: number[] };
  difficulty: DifficultyBucket;
  combatants: TipsCombatantInput[];
  ruleset: "5e-2014" | "5e-2024";
};
