"use client";

import { del, get, set } from "idb-keyval";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import {
  type Combatant,
  type CombatantSide,
  type Condition,
  CONDITIONS,
  type Encounter,
  type EncounterMap,
  type EncounterRuleset,
  type EncounterTips,
  encounterTipsSchema,
  type PartyMember,
  type Position,
} from "@/lib/domain/encounter/encounter.schema";
import { parseHitPoints } from "@/lib/domain/encounter/utils/parseHitPoints";
import type { Monster } from "@/lib/domain/monster.schema";
import type { TipsRequestPayload } from "@/lib/encounter-tips/types";
import { rollDie } from "@/lib/util/dice";

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

type TipsEphemeral = {
  loading: boolean;
  error: string | null;
};

type SavedPartyMember = { name: string; level: number };

type EncounterLibraryStore = {
  encounters: Encounter[];
  savedParty: SavedPartyMember[];
  // Ephemeral per-encounter LLM call state (not persisted to IDB)
  tipsEphemeral: Record<string, TipsEphemeral>;
  // Library
  createEncounter: (name?: string) => string;
  setSavedParty: (party: SavedPartyMember[]) => void;
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
  // Initiative
  setCombatantInitiative: (
    id: string,
    combatantId: string,
    value: number | null
  ) => void;
  setPartyMemberInitiative: (
    id: string,
    memberId: string,
    value: number | null
  ) => void;
  setPartyMemberInitiativeMod: (
    id: string,
    memberId: string,
    mod: number
  ) => void;
  rollCombatantInitiatives: (
    id: string,
    dexModByCombatantId: Map<string, number>,
    sideFilter?: CombatantSide
  ) => void;
  rollPartyMemberInitiatives: (id: string) => void;
  setActiveTurn: (id: string, activeIndex: number | null) => void;
  nextTurn: (id: string) => void;
  previousTurn: (id: string) => void;
  resetInitiative: (id: string) => void;
  endEncounter: (id: string) => void;
  // Tips
  generateTips: (id: string, request: TipsRequestPayload) => Promise<void>;
  clearTips: (id: string) => void;
  // Conditions
  toggleCondition: (
    encounterId: string,
    combatantId: string,
    condition: Condition
  ) => void;
  clearConditions: (encounterId: string, combatantId: string) => void;
  // Map
  setMap: (id: string, partial: Partial<EncounterMap>) => void;
  clearMap: (id: string) => void;
  placeToken: (
    id: string,
    kind: TokenKind,
    targetId: string,
    pos: Position
  ) => void;
  removeToken: (id: string, kind: TokenKind, targetId: string) => void;
  moveToken: (
    id: string,
    kind: TokenKind,
    targetId: string,
    pos: Position
  ) => void;
};

export type TokenKind = "pc" | "combatant";

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

function applyTokenPosition(
  encounter: Encounter,
  kind: TokenKind,
  targetId: string,
  pos: Position | null
): Encounter {
  if (kind === "pc") {
    return {
      ...encounter,
      partyMembers: encounter.partyMembers.map((p) => {
        if (p.id !== targetId) return p;
        if (pos === null) {
          const { position: _drop, ...rest } = p;
          void _drop;
          return rest;
        }
        return { ...p, position: pos };
      }),
    };
  }
  return {
    ...encounter,
    combatants: encounter.combatants.map((c) => {
      if (c.id !== targetId) return c;
      if (pos === null) {
        const { position: _drop, ...rest } = c;
        void _drop;
        return rest;
      }
      return { ...c, position: pos };
    }),
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

export type EncounterLibraryState = {
  encounters: Encounter[];
  savedParty: SavedPartyMember[];
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function readString(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function readFiniteNumber(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function readNullableNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function readRuleset(v: unknown): EncounterRuleset {
  return v === "basic" ? "basic" : "advanced";
}

function readSide(v: unknown): CombatantSide {
  return v === "ally" ? "ally" : "enemy";
}

function readPosition(v: unknown): { x: number; y: number } | null {
  if (!isPlainObject(v)) return null;
  const x = readNullableNumber(v.x);
  const y = readNullableNumber(v.y);
  if (x === null || y === null) return null;
  return { x, y };
}

function readInitiativeState(v: unknown): {
  round: number;
  activeIndex: number | null;
} {
  if (!isPlainObject(v)) return { round: 1, activeIndex: null };
  return {
    round: Math.max(1, Math.trunc(readFiniteNumber(v.round, 1))),
    activeIndex: readNullableNumber(v.activeIndex),
  };
}

function readTips(v: unknown): Encounter["tips"] {
  if (!isPlainObject(v)) return null;
  const arrOfStrings = (raw: unknown): string[] =>
    Array.isArray(raw) ? raw.filter((s) => typeof s === "string") : [];
  return {
    terrainIdeas: arrOfStrings(v.terrainIdeas),
    environmentalHazards: arrOfStrings(v.environmentalHazards),
    mechanicSuggestions: arrOfStrings(v.mechanicSuggestions),
    tacticalNotes: readString(v.tacticalNotes, ""),
  };
}

function migratePartyMember(raw: unknown): PartyMember {
  const r = isPlainObject(raw) ? raw : {};
  const notesValue = typeof r.notes === "string" ? r.notes : undefined;
  const position = readPosition(r.position);
  const member: PartyMember = {
    id: readString(r.id, crypto.randomUUID()),
    kind: "pc",
    name: readString(r.name, "PC"),
    level: clamp(Math.trunc(readFiniteNumber(r.level, 1)), 1, 20),
    initiativeMod: Math.trunc(readFiniteNumber(r.initiativeMod, 0)),
    initiative: readNullableNumber(r.initiative),
    ...(position !== null ? { position } : {}),
    ...(notesValue !== undefined ? { notes: notesValue } : {}),
  };
  return member;
}

function migrateCombatant(raw: unknown): Combatant {
  const r = isPlainObject(raw) ? raw : {};
  const maxHp = Math.max(1, Math.trunc(readFiniteNumber(r.maxHp, 1)));
  const currentHp = clamp(
    Math.trunc(readFiniteNumber(r.currentHp, maxHp)),
    0,
    maxHp
  );
  const position = readPosition(r.position);
  const nameOverride =
    typeof r.nameOverride === "string" ? r.nameOverride : undefined;
  const conditionsSet = new Set<string>(CONDITIONS);
  const conditions: Condition[] = Array.isArray(r.conditions)
    ? r.conditions.filter(
        (c: unknown): c is Condition =>
          typeof c === "string" && conditionsSet.has(c)
      )
    : [];
  const combatant: Combatant = {
    id: readString(r.id, crypto.randomUUID()),
    monsterId: readString(r.monsterId, ""),
    monsterName: readString(r.monsterName, "Unknown"),
    monsterCrNumeric: Math.max(0, readFiniteNumber(r.monsterCrNumeric, 0)),
    side: readSide(r.side),
    maxHp,
    currentHp,
    initiative: readNullableNumber(r.initiative),
    conditions,
    ...(nameOverride !== undefined ? { nameOverride } : {}),
    ...(position !== null ? { position } : {}),
  };
  return combatant;
}

function readMap(v: unknown): EncounterMap | null {
  if (!isPlainObject(v)) return null;
  if (v.grid !== "square") return null;
  const cols = clamp(Math.trunc(readFiniteNumber(v.cols, 20)), 4, 100);
  const rows = clamp(Math.trunc(readFiniteNumber(v.rows, 15)), 4, 100);
  const cellSize = clamp(Math.trunc(readFiniteNumber(v.cellSize, 48)), 24, 96);
  const backgroundUrl =
    typeof v.backgroundUrl === "string" ? v.backgroundUrl : undefined;
  return {
    grid: "square",
    cols,
    rows,
    cellSize,
    ...(backgroundUrl !== undefined ? { backgroundUrl } : {}),
  };
}

function migrateEncounterToCurrent(raw: unknown): Encounter {
  const r = isPlainObject(raw) ? raw : {};
  const partyMembersRaw = Array.isArray(r.partyMembers) ? r.partyMembers : [];
  const combatantsRaw = Array.isArray(r.combatants) ? r.combatants : [];
  const map = readMap(r.map);
  return {
    id: readString(r.id, crypto.randomUUID()),
    name: readString(r.name, "Untitled encounter"),
    ruleset: readRuleset(r.ruleset),
    partyMembers: partyMembersRaw.map(migratePartyMember),
    combatants: combatantsRaw.map(migrateCombatant),
    initiative: readInitiativeState(r.initiative),
    tips: readTips(r.tips),
    tipsGeneratedAt: readNullableNumber(r.tipsGeneratedAt),
    ...(map !== null ? { map } : {}),
    createdAt: readFiniteNumber(r.createdAt, Date.now()),
    updatedAt: readFiniteNumber(r.updatedAt, Date.now()),
  };
}

// Migrates persisted state from older `version` values up to the current
// schema. Each step is additive: Slice 2 fills in `initiative`, `tips`,
// `tipsGeneratedAt` on encounters (with defaults) and `initiativeMod`,
// `initiative` on party members + combatants. Unknown shapes are coerced
// with sensible defaults rather than dropped so saved encounters survive
// even if a v1 record was hand-edited.
export function migrateEncounterLibrary(
  persistedState: unknown,
  fromVersion: number
): EncounterLibraryState {
  const state = isPlainObject(persistedState) ? persistedState : {};
  const rawEncounters = Array.isArray(state.encounters) ? state.encounters : [];
  if (fromVersion < 1) {
    return { encounters: [], savedParty: [] };
  }
  const rawSavedParty = Array.isArray(state.savedParty) ? state.savedParty : [];
  const savedParty = rawSavedParty
    .filter((p): p is Record<string, unknown> => isPlainObject(p))
    .map((p) => ({
      name: readString(p.name, "PC"),
      level: clamp(Math.trunc(readFiniteNumber(p.level, 1)), 1, 20),
    }));
  return {
    encounters: rawEncounters.map(migrateEncounterToCurrent),
    savedParty,
  };
}

export const useEncounterLibraryStore = create<EncounterLibraryStore>()(
  persist(
    (set, get) => ({
      encounters: [],
      savedParty: [],
      tipsEphemeral: {},

      createEncounter: (name?: string): string => {
        if (name !== undefined && name.trim() === "") {
          return "";
        }
        const id = crypto.randomUUID();
        const now = Date.now();
        const savedParty = get().savedParty;
        const partyMembers: PartyMember[] = savedParty.map((p) => ({
          id: crypto.randomUUID(),
          kind: "pc" as const,
          name: p.name,
          level: p.level,
          initiativeMod: 0,
          initiative: null,
        }));
        const newEncounter: Encounter = {
          id,
          name: name?.trim() || "New encounter",
          ruleset: "advanced",
          partyMembers,
          combatants: [],
          initiative: { round: 1, activeIndex: null },
          tips: null,
          tipsGeneratedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ encounters: [...state.encounters, newEncounter] }));
        return id;
      },

      setSavedParty: (party: SavedPartyMember[]): void => {
        set({ savedParty: party });
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
          initiativeMod: 0,
          initiative: null,
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
            initiative: null,
            conditions: [],
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

      setCombatantInitiative: (
        id: string,
        combatantId: string,
        value: number | null
      ): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) =>
            updateCombatant(e, combatantId, (c) => ({
              ...c,
              initiative: value === null ? null : Math.trunc(value),
            }))
          ),
        }));
      },

      setPartyMemberInitiative: (
        id: string,
        memberId: string,
        value: number | null
      ): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => ({
            ...e,
            partyMembers: e.partyMembers.map((p) =>
              p.id === memberId
                ? {
                    ...p,
                    initiative: value === null ? null : Math.trunc(value),
                  }
                : p
            ),
          })),
        }));
      },

      setPartyMemberInitiativeMod: (
        id: string,
        memberId: string,
        mod: number
      ): void => {
        const safe = Number.isFinite(mod) ? Math.trunc(mod) : 0;
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => ({
            ...e,
            partyMembers: e.partyMembers.map((p) =>
              p.id === memberId ? { ...p, initiativeMod: safe } : p
            ),
          })),
        }));
      },

      rollCombatantInitiatives: (
        id: string,
        dexModByCombatantId: Map<string, number>,
        sideFilter?: CombatantSide
      ): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => ({
            ...e,
            combatants: e.combatants.map((c) => {
              if (sideFilter && c.side !== sideFilter) return c;
              const mod = dexModByCombatantId.get(c.id) ?? 0;
              return { ...c, initiative: rollDie(20) + mod };
            }),
          })),
        }));
      },

      rollPartyMemberInitiatives: (id: string): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => ({
            ...e,
            partyMembers: e.partyMembers.map((p) => ({
              ...p,
              initiative: rollDie(20) + p.initiativeMod,
            })),
          })),
        }));
      },

      setActiveTurn: (id: string, activeIndex: number | null): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => ({
            ...e,
            initiative: { ...e.initiative, activeIndex },
          })),
        }));
      },

      nextTurn: (id: string): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => {
            const total = e.partyMembers.length + e.combatants.length;
            if (total === 0) return e;
            const current = e.initiative.activeIndex;
            if (current === null) {
              return {
                ...e,
                initiative: { round: e.initiative.round, activeIndex: 0 },
              };
            }
            const wraps = current + 1 >= total;
            return {
              ...e,
              initiative: {
                round: wraps ? e.initiative.round + 1 : e.initiative.round,
                activeIndex: wraps ? 0 : current + 1,
              },
            };
          }),
        }));
      },

      previousTurn: (id: string): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => {
            const total = e.partyMembers.length + e.combatants.length;
            if (total === 0) return e;
            const current = e.initiative.activeIndex;
            if (current === null || current <= 0) {
              if (e.initiative.round <= 1) return e;
              return {
                ...e,
                initiative: {
                  round: e.initiative.round - 1,
                  activeIndex: total - 1,
                },
              };
            }
            return {
              ...e,
              initiative: {
                round: e.initiative.round,
                activeIndex: current - 1,
              },
            };
          }),
        }));
      },

      resetInitiative: (id: string): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => ({
            ...e,
            partyMembers: e.partyMembers.map((p) => ({
              ...p,
              initiative: null,
            })),
            combatants: e.combatants.map((c) => ({ ...c, initiative: null })),
            initiative: { round: 1, activeIndex: null },
          })),
        }));
      },

      endEncounter: (id: string): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => ({
            ...e,
            partyMembers: e.partyMembers.map((p) => ({
              ...p,
              initiative: null,
            })),
            combatants: e.combatants.map((c) => ({
              ...c,
              initiative: null,
              currentHp: c.maxHp,
              conditions: [],
            })),
            initiative: { round: 1, activeIndex: null },
          })),
        }));
      },

      generateTips: async (
        id: string,
        request: TipsRequestPayload
      ): Promise<void> => {
        set((state) => ({
          tipsEphemeral: {
            ...state.tipsEphemeral,
            [id]: { loading: true, error: null },
          },
        }));
        try {
          const response = await fetch("/api/encounters/tips", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
          });
          const envelope: unknown = await response.json();
          if (!isPlainObject(envelope)) {
            throw new Error("Unexpected response shape.");
          }
          if (envelope.ok !== true) {
            const errObj = isPlainObject(envelope.error)
              ? envelope.error
              : null;
            const message =
              errObj && typeof errObj.message === "string"
                ? errObj.message
                : "Failed to generate tips.";
            throw new Error(message);
          }
          const tipsParse = encounterTipsSchema.safeParse(envelope.data);
          if (!tipsParse.success) {
            throw new Error("Tips response invalid shape.");
          }
          const tips: EncounterTips = tipsParse.data;
          set((state) => ({
            encounters: updateEncounter(state.encounters, id, (e) => ({
              ...e,
              tips,
              tipsGeneratedAt: Date.now(),
            })),
            tipsEphemeral: {
              ...state.tipsEphemeral,
              [id]: { loading: false, error: null },
            },
          }));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to generate tips.";
          set((state) => ({
            tipsEphemeral: {
              ...state.tipsEphemeral,
              [id]: { loading: false, error: message },
            },
          }));
        }
      },

      toggleCondition: (
        encounterId: string,
        combatantId: string,
        condition: Condition
      ): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, encounterId, (e) =>
            updateCombatant(e, combatantId, (c) => {
              const has = c.conditions.includes(condition);
              return {
                ...c,
                conditions: has
                  ? c.conditions.filter((cond) => cond !== condition)
                  : [...c.conditions, condition],
              };
            })
          ),
        }));
      },

      clearConditions: (encounterId: string, combatantId: string): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, encounterId, (e) =>
            updateCombatant(e, combatantId, (c) => ({
              ...c,
              conditions: [],
            }))
          ),
        }));
      },

      clearTips: (id: string): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => ({
            ...e,
            tips: null,
            tipsGeneratedAt: null,
          })),
          tipsEphemeral: {
            ...state.tipsEphemeral,
            [id]: { loading: false, error: null },
          },
        }));
      },

      setMap: (id: string, partial: Partial<EncounterMap>): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => {
            const current: EncounterMap = e.map ?? {
              grid: "square",
              cols: 20,
              rows: 15,
              cellSize: 48,
            };
            const next: EncounterMap = { ...current, ...partial };
            return { ...e, map: next };
          }),
        }));
      },

      clearMap: (id: string): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) => {
            const { map: _drop, ...rest } = e;
            void _drop;
            return {
              ...rest,
              partyMembers: e.partyMembers.map((p) => {
                const { position: _p, ...pRest } = p;
                void _p;
                return pRest;
              }),
              combatants: e.combatants.map((c) => {
                const { position: _p, ...cRest } = c;
                void _p;
                return cRest;
              }),
            };
          }),
        }));
      },

      placeToken: (
        id: string,
        kind: TokenKind,
        targetId: string,
        pos: Position
      ): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) =>
            applyTokenPosition(e, kind, targetId, pos)
          ),
        }));
      },

      moveToken: (
        id: string,
        kind: TokenKind,
        targetId: string,
        pos: Position
      ): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) =>
            applyTokenPosition(e, kind, targetId, pos)
          ),
        }));
      },

      removeToken: (id: string, kind: TokenKind, targetId: string): void => {
        set((state) => ({
          encounters: updateEncounter(state.encounters, id, (e) =>
            applyTokenPosition(e, kind, targetId, null)
          ),
        }));
      },
    }),
    {
      name: "dnd-tools-encounters",
      partialize: (state) => ({
        encounters: state.encounters,
        savedParty: state.savedParty,
      }),
      storage: createJSONStorage(() => persistenceStorage),
      version: 5,
      migrate: migrateEncounterLibrary,
    }
  )
);

export type { EncounterLibraryStore };
