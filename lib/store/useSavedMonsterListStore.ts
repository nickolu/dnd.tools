"use client";

import { del, get, set } from "idb-keyval";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import type { SavedMonsterList } from "@/lib/domain/saved-monster-list";

type SavedMonsterListStore = {
  lists: SavedMonsterList[];
  // Actions
  createList: (name: string) => string;
  deleteList: (listId: string) => void;
  renameList: (listId: string, name: string) => void;
  addMonsterToList: (listId: string, monsterId: string) => void;
  removeMonsterFromList: (listId: string, monsterId: string) => void;
  toggleMonsterInActiveList: (listId: string, monsterId: string) => void;
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

export const useSavedMonsterListStore = create<SavedMonsterListStore>()(
  persist(
    (set, get) => ({
      lists: [],

      createList: (name: string): string => {
        const trimmed = name.trim();
        if (!trimmed) return "";
        const id = crypto.randomUUID();
        const now = Date.now();
        const newList: SavedMonsterList = {
          id,
          name: trimmed,
          monsterIds: [],
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

      addMonsterToList: (listId: string, monsterId: string): void => {
        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id !== listId) return l;
            if (l.monsterIds.includes(monsterId)) return l;
            return {
              ...l,
              monsterIds: [...l.monsterIds, monsterId],
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      removeMonsterFromList: (listId: string, monsterId: string): void => {
        set((state) => ({
          lists: state.lists.map((l) => {
            if (l.id !== listId) return l;
            if (!l.monsterIds.includes(monsterId)) return l;
            return {
              ...l,
              monsterIds: l.monsterIds.filter((s) => s !== monsterId),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      toggleMonsterInActiveList: (listId: string, monsterId: string): void => {
        const list = get().lists.find((l) => l.id === listId);
        if (!list) return;
        if (list.monsterIds.includes(monsterId)) {
          get().removeMonsterFromList(listId, monsterId);
        } else {
          get().addMonsterToList(listId, monsterId);
        }
      },
    }),
    {
      name: "dnd-tools-saved-monster-lists",
      partialize: (state) => ({
        lists: state.lists,
      }),
      storage: createJSONStorage(() => persistenceStorage),
      version: 1,
    }
  )
);

export type { SavedMonsterListStore };
