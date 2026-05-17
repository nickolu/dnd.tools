"use client";

import { del, get, set } from "idb-keyval";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import type {
  Combatant,
  CombatantSide,
  Encounter,
  EncounterRuleset,
  PartyMember,
} from "@/lib/domain/encounter/encounter.schema";
import { parseHitPoints } from "@/lib/domain/encounter/utils/parseHitPoints";
import type { Monster } from "@/lib/domain/monster.schema";

type AddPcInput = {
  name: string;
  level: number;
};

type UpdatePartyMemberPatch = Partial<Pick<PartyMember, "name" | "level">>;

type AddCombatantInput = {
  monster: Monster;
  side: CombatantSide;
  quantity?: number;
};

type EncounterLibraryStore = {
  encounters: Encounter[];
  // Library
  createEncounter: (name?: string) => string;
  deleteEncounter: (id: string) => void;
  renameEncounter: (id: string, name: string) => void;
  duplicateEncounter: (id: string) => string;
  // Editor
  setRuleset: (id: string, ruleset: EncounterRuleset) => void;
  addPC: (id: string, input: AddPcInput) => string;
  removePartyMember: (id: string, memberId: string) => void;
  updatePartyMember: (
    id: string,
    memberId: string,
    patch: UpdatePartyMemberPatch
  ) => void;
  addCombatant: (id: string, input: AddCombatantInput) => string[];
  removeCombatant: (id: string, combatantId: string) => void;
  updateCombatantName: (id: string, combatantId: string, name: string) => void;
  adjustHp: (id: string, combatantId: string, delta: number) => void;
  setHp: (id: string, combatantId: string, currentHp: number) => void;
  setMaxHp: (id: string, combatantId: string, maxHp: number) => void;
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

function updateEncounter(
  encounters: Encounter[],
  id: string,
  patch: (e: Encounter) => Encounter
): Encounter[] {
  return encounters.map((e) =>
    e.id === id ? { ...patch(e), updatedAt: Date.now() } : e
  );
}

function updateCombatant(
  encounter: Encounter,
  combatantId: string,
  patch: (c: Combatant) => Combatant
): Encounter {
  return {
    ...encounter,
    combatants: encounter.combatants.map((c) =>
      c.id === combatantId ? patch(c) : c
    ),
  };
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function bounded(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return clamp(Math.trunc(level), 1, 20);
}

export const useEncounterLibraryStore = create<EncounterLibraryStore>()(
  persist(
    (set, get) => ({
      encounters: [],

      createEncounter: (name?: string): string => {
        if (name !== undefined && name.trim() === "") {
          return "";
        }
        const id = crypto.randomUUID();
        const now = Date.now();
        const newEncounter: Encounter = {
          id,
          name: name?.trim() || "New encounter",
          ruleset: "advanced",
          partyMembers: [],
          combatants: [],
          createdAt: now,
          updatedAt: now,
          schemaVersion: 1,
        };
        set((state) => ({ encounters: [...state.encounters, newEncounter] }));
        return id;
      },

      deleteEncounter: (id: string): void => {
        set((state) => ({
          encounters: state.encounters.filter((e) => e.id !== id),
        }));
      },

      renameEncounter: (id: string, name: string): void => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => ({
            ...e,
            name: trimmed,
          })),
        }));
      },

      duplicateEncounter: (id: string): string => {
        const source = get().encounters.find((e) => e.id === id);
        if (!source) return "";
        const newId = crypto.randomUUID();
        const now = Date.now();
        const copy: Encounter = {
          ...source,
          id: newId,
          name: `${source.name} (copy)`,
          createdAt: now,
          updatedAt: now,
          // Deep-copy party + combatants so HP edits don't share state
          partyMembers: source.partyMembers.map((p) => ({
            ...p,
            id: crypto.randomUUID(),
          })),
          combatants: source.combatants.map((c) => ({
            ...c,
            id: crypto.randomUUID(),
          })),
        };
        set((state) => ({ encounters: [...state.encounters, copy] }));
        return newId;
      },

      setRuleset: (id: string, ruleset: EncounterRuleset): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => ({
            ...e,
            ruleset,
          })),
        }));
      },

      addPC: (id: string, input: AddPcInput): string => {
        const trimmed = input.name.trim();
        if (!trimmed) return "";
        const memberId = crypto.randomUUID();
        const member: PartyMember = {
          id: memberId,
          kind: "pc",
          name: trimmed,
          level: bounded(input.level),
        };
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => ({
            ...e,
            partyMembers: [...e.partyMembers, member],
          })),
        }));
        return memberId;
      },

      removePartyMember: (id: string, memberId: string): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => ({
            ...e,
            partyMembers: e.partyMembers.filter((p) => p.id !== memberId),
          })),
        }));
      },

      updatePartyMember: (
        id: string,
        memberId: string,
        patch: UpdatePartyMemberPatch
      ): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => ({
            ...e,
            partyMembers: e.partyMembers.map((p) => {
              if (p.id !== memberId) return p;
              const next: PartyMember = { ...p };
              if (patch.name !== undefined) {
                const trimmed = patch.name.trim();
                if (trimmed) next.name = trimmed;
              }
              if (patch.level !== undefined) {
                next.level = bounded(patch.level);
              }
              return next;
            }),
          })),
        }));
      },

      addCombatant: (id: string, input: AddCombatantInput): string[] => {
        const quantity = Math.max(1, Math.trunc(input.quantity ?? 1));
        const maxHp = parseHitPoints(input.monster.hitPoints);
        const ids: string[] = [];
        const newCombatants: Combatant[] = [];
        for (let i = 0; i < quantity; i++) {
          const combatantId = crypto.randomUUID();
          ids.push(combatantId);
          newCombatants.push({
            id: combatantId,
            monsterId: input.monster.id,
            monsterName: input.monster.name,
            monsterCrNumeric: input.monster.crNumeric,
            side: input.side,
            maxHp,
            currentHp: maxHp,
          });
        }
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => ({
            ...e,
            combatants: [...e.combatants, ...newCombatants],
          })),
        }));
        return ids;
      },

      removeCombatant: (id: string, combatantId: string): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => ({
            ...e,
            combatants: e.combatants.filter((c) => c.id !== combatantId),
          })),
        }));
      },

      updateCombatantName: (
        id: string,
        combatantId: string,
        name: string
      ): void => {
        const trimmed = name.trim();
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) =>
            updateCombatant(e, combatantId, (c) => {
              if (!trimmed) {
                const { nameOverride: _drop, ...rest } = c;
                void _drop;
                return rest;
              }
              return { ...c, nameOverride: trimmed };
            })
          ),
        }));
      },

      adjustHp: (id: string, combatantId: string, delta: number): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) =>
            updateCombatant(e, combatantId, (c) => ({
              ...c,
              currentHp: clamp(c.currentHp + delta, 0, c.maxHp),
            }))
          ),
        }));
      },

      setHp: (id: string, combatantId: string, currentHp: number): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) =>
            updateCombatant(e, combatantId, (c) => ({
              ...c,
              currentHp: clamp(Math.trunc(currentHp), 0, c.maxHp),
            }))
          ),
        }));
      },

      setMaxHp: (id: string, combatantId: string, maxHp: number): void => {
        const safeMax = Math.max(1, Math.trunc(maxHp));
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) =>
            updateCombatant(e, combatantId, (c) => ({
              ...c,
              maxHp: safeMax,
              currentHp: clamp(c.currentHp, 0, safeMax),
            }))
          ),
        }));
      },
    }),
    {
      name: "dnd-tools-encounters",
      partialize: (state) => ({
        encounters: state.encounters,
      }),
      storage: createJSONStorage(() => persistenceStorage),
      version: 1,
    }
  )
);

export type { EncounterLibraryStore };
