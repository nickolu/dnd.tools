import type {
  CombatantSide,
  Encounter,
} from "@/lib/domain/encounter/encounter.schema";

import type { EncounterLibraryStore } from "./useEncounterLibraryStore";

export const selectEncounterById =
  (id: string) =>
  (state: EncounterLibraryStore): Encounter | null =>
    state.encounters.find((e) => e.id === id) ?? null;

export const selectCombatantsBySide =
  (id: string, side: CombatantSide) => (state: EncounterLibraryStore) => {
    const encounter = state.encounters.find((e) => e.id === id);
    if (!encounter) return [];
    return encounter.combatants.filter((c) => c.side === side);
  };
