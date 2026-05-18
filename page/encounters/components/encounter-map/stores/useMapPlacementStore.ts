import { create } from "zustand";

import type { TokenKind } from "@/lib/store/useEncounterLibraryStore";

type TokenRef = { kind: TokenKind; id: string };

type MapPlacementStore = {
  pendingPlace: TokenRef | null;
  setPendingPlace: (ref: TokenRef | null) => void;
};

export const useMapPlacementStore = create<MapPlacementStore>((set) => ({
  pendingPlace: null,
  setPendingPlace: (ref) => set({ pendingPlace: ref }),
}));
