"use client";

import { del, get, set } from "idb-keyval";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

type SortDirection = "asc" | "desc";

type CompendiumStore = {
  filters: {
    monsterName: string;
    spellName: string;
  };
  selectedMonsterId: string | null;
  selectedSpellId: string | null;
  sort: {
    direction: SortDirection;
    field: string;
  };
  setMonsterFilter: (value: string) => void;
  setSelectedMonsterId: (id: string | null) => void;
  setSelectedSpellId: (id: string | null) => void;
  setSort: (field: string, direction: SortDirection) => void;
  setSpellFilter: (value: string) => void;
};

const noopStorage: StateStorage = {
  getItem: () => null,
  removeItem: () => {},
  setItem: () => {},
};

const indexedDbStorage: StateStorage = {
  getItem: async (name) => {
    const value = await get<string>(name);
    return value ?? null;
  },
  removeItem: async (name) => {
    await del(name);
  },
  setItem: async (name, value) => {
    await set(name, value);
  },
};

const persistenceStorage =
  typeof window === "undefined" ? noopStorage : indexedDbStorage;

export const useCompendiumStore = create<CompendiumStore>()(
  persist(
    (set) => ({
      filters: {
        monsterName: "",
        spellName: "",
      },
      selectedMonsterId: null,
      selectedSpellId: null,
      setMonsterFilter: (value) => {
        set((state) => ({
          filters: {
            ...state.filters,
            monsterName: value,
          },
        }));
      },
      setSelectedMonsterId: (id) => {
        set({ selectedMonsterId: id });
      },
      setSelectedSpellId: (id) => {
        set({ selectedSpellId: id });
      },
      setSort: (field, direction) => {
        set({
          sort: {
            direction,
            field,
          },
        });
      },
      setSpellFilter: (value) => {
        set((state) => ({
          filters: {
            ...state.filters,
            spellName: value,
          },
        }));
      },
      sort: {
        direction: "asc",
        field: "nameNormalized",
      },
    }),
    {
      name: "dnd-tools-compendium",
      partialize: (state) => ({
        filters: state.filters,
        selectedMonsterId: state.selectedMonsterId,
        selectedSpellId: state.selectedSpellId,
        sort: state.sort,
      }),
      storage: createJSONStorage(() => persistenceStorage),
      version: 1,
    }
  )
);

export type { CompendiumStore, SortDirection };
