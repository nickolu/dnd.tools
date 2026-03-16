"use client";

import { del, get, set } from "idb-keyval";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import type { SavedSpellList } from "@/lib/domain/saved-spell-list";

type SavedSpellListStore = {
  lists: SavedSpellList[];
  // Actions
  createList: (name: string) => string;
  deleteList: (listId: string) => void;
  renameList: (listId: string, name: string) => void;
  addSpellToList: (listId: string, spellId: string) => void;
  removeSpellFromList: (listId: string, spellId: string) => void;
  toggleSpellInActiveList: (listId: string, spellId: string) => void;
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

export const useSavedSpellListStore = create<SavedSpellListStore>()(
  persist(
    (set, get) => ({
      lists: [],

      createList: (name: string): string => {
        const trimmed = name.trim();
        if (!trimmed) return "";
        const id = crypto.randomUUID();
        const now = Date.now();
        const newList: SavedSpellList = {
          id,
          name: trimmed,
          spellIds: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ lists: [...state.lists, newList] }));
        return id;
      },

      deleteList: (listId: string): void => {
        set((state) => ({
          lists: state.lists.filter((l) => l.id !== listId),
        }));
      },

      renameList: (listId: string, name: string): void => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId ? { ...l, name: trimmed, updatedAt: Date.now() } : l
          ),
        }));
      },

      addSpellToList: (listId: string, spellId: string): void => {
        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id !== listId) return l;
            if (l.spellIds.includes(spellId)) return l;
            return {
              ...l,
              spellIds: [...l.spellIds, spellId],
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      removeSpellFromList: (listId: string, spellId: string): void => {
        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id !== listId) return l;
            if (!l.spellIds.includes(spellId)) return l;
            return {
              ...l,
              spellIds: l.spellIds.filter((s) => s !== spellId),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      toggleSpellInActiveList: (listId: string, spellId: string): void => {
        const list = get().lists.find((l) => l.id === listId);
        if (!list) return;
        if (list.spellIds.includes(spellId)) {
          get().removeSpellFromList(listId, spellId);
        } else {
          get().addSpellToList(listId, spellId);
        }
      },
    }),
    {
      name: "dnd-tools-saved-spell-lists",
      partialize: (state) => ({
        lists: state.lists,
      }),
      storage: createJSONStorage(() => persistenceStorage),
      version: 1,
    }
  )
);

export type { SavedSpellListStore };
