import type { EncounterRuleset } from "@/lib/domain/encounter/encounter.schema";

export const DEFAULT_PC_LEVEL = 5;

export const RULESET_LABEL_BY_VALUE: Record<EncounterRuleset, string> = {
  basic: "Basic",
  advanced: "Advanced",
};

export const RULESET_HELP_BY_VALUE: Record<EncounterRuleset, string> = {
  basic: "Single Monster Power per CR; five difficulty tiers.",
  advanced:
    "Monster Power scales by party tier; adds Overwhelming, Crushing, Devastating, and Impossible tiers.",
};

export const ENCOUNTER_LIBRARY_DEFAULT_NAME = "New encounter";
