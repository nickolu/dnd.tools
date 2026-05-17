import { create } from "zustand";

import factionsData from "@/lib/domain/mausritter/data/factions/factions.json";
import landmarkDetailsData from "@/lib/domain/mausritter/data/hex-contents/landmark-details.json";
import countrysideData from "@/lib/domain/mausritter/data/hex-contents/landmarks-countryside.json";
import forestData from "@/lib/domain/mausritter/data/hex-contents/landmarks-forest.json";
import humanTownData from "@/lib/domain/mausritter/data/hex-contents/landmarks-human-town.json";
import riverData from "@/lib/domain/mausritter/data/hex-contents/landmarks-river.json";
import eventsData from "@/lib/domain/mausritter/data/settlements/events.json";
import { shuffled } from "@/lib/util/dice";

import { DEFAULT_CONFIG } from "../constants";
import type {
  GeneratedFaction,
  GeneratedHex,
  GeneratedLore,
  HexCrawlConfig,
} from "../types";
import { generateAdventureSite } from "../utils/generate-adventure-site";
import { generateHex } from "../utils/generate-hex";
import { generateHexCrawl } from "../utils/generate-hex-crawl";
import { generateNpc } from "../utils/generate-npc";
import { generateRoom } from "../utils/generate-room";
import { generateSettlement } from "../utils/generate-settlement";
import { rollOnRandomTable } from "../utils/roll-on-table";

const landmarkTableByType: Record<string, typeof countrysideData> = {
  Countryside: countrysideData,
  Forest: forestData,
  River: riverData,
  "Human town": humanTownData,
};

function updateHex(
  hexes: GeneratedHex[],
  hexId: string,
  updater: (hex: GeneratedHex) => GeneratedHex
): GeneratedHex[] {
  return hexes.map((h) => (h.id === hexId ? updater(h) : h));
}

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: { message: string } };

function serializeHexForApi(h: GeneratedHex) {
  return {
    index: h.index,
    hexType: h.hexType,
    landmark: h.landmark,
    landmarkDetail: h.landmarkDetail,
    settlement: h.settlement
      ? {
          name: h.settlement.name,
          size: h.settlement.size,
          governance: h.settlement.governance,
          detail: h.settlement.detail,
          industries: h.settlement.industries,
          event: h.settlement.event,
          tavern: h.settlement.tavern,
          npcs: h.settlement.npcs.map((n) => ({
            name: n.name,
            socialPosition: n.socialPosition,
            disposition: n.disposition,
            appearance: n.appearance,
            quirk: n.quirk,
            wants: n.wants,
          })),
        }
      : null,
    adventureSite: h.adventureSite
      ? {
          construction: h.adventureSite.construction,
          inhabitants: h.adventureSite.inhabitants,
          ruination: h.adventureSite.ruination,
          searchingFor: h.adventureSite.searchingFor,
          secret: h.adventureSite.secret,
          roomCount: h.adventureSite.rooms.length,
        }
      : null,
  };
}

function flattenLore(lore: GeneratedLore): string {
  return [
    lore.overview,
    lore.factionPolitics,
    lore.notableCharacters,
    lore.adventureHooks,
    lore.notableLocations,
  ].join("\n\n");
}

type HexCrawlStore = {
  config: HexCrawlConfig;
  hexes: GeneratedHex[];
  factions: GeneratedFaction[];
  generatedAt: number | null;

  lore: GeneratedLore | null;
  loreLoading: boolean;
  loreError: string | null;
  hexLoreLoadingIds: Record<string, true>;
  hexLoreErrors: Record<string, string>;

  setConfig: (partial: Partial<HexCrawlConfig>) => void;
  generate: () => void;
  clear: () => void;

  generateLore: () => Promise<void>;
  clearLore: () => void;
  generateHexLore: (hexId: string) => Promise<void>;

  rerollHex: (hexId: string) => void;
  rerollHexLandmark: (hexId: string) => void;
  rerollHexLandmarkDetail: (hexId: string) => void;
  rerollSettlement: (hexId: string) => void;
  rerollSettlementEvent: (hexId: string) => void;
  rerollNpc: (hexId: string, npcId: string) => void;
  rerollFactions: () => void;
  rerollAdventureSite: (hexId: string) => void;
  rerollRoom: (hexId: string, roomId: string) => void;

  addSettlement: (hexId: string) => void;
  removeSettlement: (hexId: string) => void;
  addAdventureSite: (hexId: string) => void;
  removeAdventureSite: (hexId: string) => void;
  addNpc: (hexId: string) => void;
  addRoom: (hexId: string) => void;
};

export const useHexCrawlStore = create<HexCrawlStore>((set, get) => ({
  config: DEFAULT_CONFIG,
  hexes: [],
  factions: [],
  generatedAt: null,

  lore: null,
  loreLoading: false,
  loreError: null,
  hexLoreLoadingIds: {},
  hexLoreErrors: {},

  setConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),

  generate: () => {
    const state = generateHexCrawl(get().config);
    set({
      ...state,
      lore: null,
      loreLoading: false,
      loreError: null,
      hexLoreLoadingIds: {},
      hexLoreErrors: {},
    });
  },

  clear: () =>
    set({
      hexes: [],
      factions: [],
      generatedAt: null,
      lore: null,
      loreLoading: false,
      loreError: null,
      hexLoreLoadingIds: {},
      hexLoreErrors: {},
    }),

  generateLore: async () => {
    const { hexes, factions } = get();
    if (hexes.length === 0) return;

    set({ loreLoading: true, loreError: null });

    const payload = {
      hexes: hexes.map(serializeHexForApi),
      factions: factions.map((f) => ({
        name: f.name,
        resources: f.resources,
        goals: f.goals.map((g) => ({ description: g.description })),
      })),
    };

    try {
      const res = await fetch("/api/mausritter/lore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json: ApiOk<GeneratedLore> | ApiErr = await res.json();

      if (!json.ok) {
        set({ loreLoading: false, loreError: json.error.message });
        return;
      }

      set({ lore: json.data, loreLoading: false });
    } catch (err) {
      set({
        loreLoading: false,
        loreError:
          err instanceof Error ? err.message : "Failed to generate lore.",
      });
    }
  },

  clearLore: () => set({ lore: null, loreLoading: false, loreError: null }),

  generateHexLore: async (hexId) => {
    const { hexes, lore } = get();
    const hex = hexes.find((h) => h.id === hexId);
    if (!hex) return;

    set((state) => ({
      hexLoreLoadingIds: { ...state.hexLoreLoadingIds, [hexId]: true },
      hexLoreErrors: Object.fromEntries(
        Object.entries(state.hexLoreErrors).filter(([k]) => k !== hexId)
      ),
    }));

    const payload = {
      hex: serializeHexForApi(hex),
      generalLore: lore ? flattenLore(lore) : null,
    };

    try {
      const res = await fetch("/api/mausritter/lore/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json: ApiOk<{ locationLore: string }> | ApiErr = await res.json();

      if (!json.ok) {
        set((state) => ({
          hexLoreLoadingIds: Object.fromEntries(
            Object.entries(state.hexLoreLoadingIds).filter(([k]) => k !== hexId)
          ),
          hexLoreErrors: {
            ...state.hexLoreErrors,
            [hexId]: json.error.message,
          },
        }));
        return;
      }

      set((state) => ({
        hexes: updateHex(state.hexes, hexId, (h) => ({
          ...h,
          narrative: json.data.locationLore,
        })),
        hexLoreLoadingIds: Object.fromEntries(
          Object.entries(state.hexLoreLoadingIds).filter(([k]) => k !== hexId)
        ),
      }));
    } catch (err) {
      set((state) => ({
        hexLoreLoadingIds: Object.fromEntries(
          Object.entries(state.hexLoreLoadingIds).filter(([k]) => k !== hexId)
        ),
        hexLoreErrors: {
          ...state.hexLoreErrors,
          [hexId]:
            err instanceof Error
              ? err.message
              : "Failed to generate location lore.",
        },
      }));
    }
  },

  rerollHex: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => {
        const newHex = generateHex(hex.index);
        return {
          ...newHex,
          settlement: hex.settlement,
          adventureSite: hex.adventureSite,
        };
      }),
    })),

  rerollHexLandmark: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => {
        const table = landmarkTableByType[hex.hexType] ?? countrysideData;
        return {
          ...hex,
          landmark: rollOnRandomTable(table),
          narrative: undefined,
        };
      }),
    })),

  rerollHexLandmarkDetail: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => ({
        ...hex,
        landmarkDetail: rollOnRandomTable(landmarkDetailsData),
        narrative: undefined,
      })),
    })),

  rerollSettlement: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => ({
        ...hex,
        settlement: generateSettlement(state.config.npcsPerSettlement),
        narrative: undefined,
      })),
    })),

  rerollSettlementEvent: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => {
        if (!hex.settlement) return hex;
        return {
          ...hex,
          narrative: undefined,
          settlement: {
            ...hex.settlement,
            event: rollOnRandomTable(eventsData),
          },
        };
      }),
    })),

  rerollNpc: (hexId, npcId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => {
        if (!hex.settlement) return hex;
        return {
          ...hex,
          narrative: undefined,
          settlement: {
            ...hex.settlement,
            npcs: hex.settlement.npcs.map((npc) =>
              npc.id === npcId ? generateNpc() : npc
            ),
          },
        };
      }),
    })),

  rerollFactions: () => {
    const { config } = get();
    const factions: GeneratedFaction[] = shuffled(factionsData.factions).slice(
      0,
      config.factionCount
    );
    set({ factions });
  },

  rerollAdventureSite: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => ({
        ...hex,
        adventureSite: generateAdventureSite(state.config.roomsPerSite),
        narrative: undefined,
      })),
    })),

  rerollRoom: (hexId, roomId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => {
        if (!hex.adventureSite) return hex;
        return {
          ...hex,
          narrative: undefined,
          adventureSite: {
            ...hex.adventureSite,
            rooms: hex.adventureSite.rooms.map((room) =>
              room.id === roomId ? generateRoom(room.roomNumber) : room
            ),
          },
        };
      }),
    })),

  addSettlement: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => ({
        ...hex,
        settlement: generateSettlement(state.config.npcsPerSettlement),
        narrative: undefined,
      })),
    })),

  removeSettlement: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => ({
        ...hex,
        settlement: null,
        narrative: undefined,
      })),
    })),

  addAdventureSite: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => ({
        ...hex,
        adventureSite: generateAdventureSite(state.config.roomsPerSite),
        narrative: undefined,
      })),
    })),

  removeAdventureSite: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => ({
        ...hex,
        adventureSite: null,
        narrative: undefined,
      })),
    })),

  addNpc: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => {
        if (!hex.settlement) return hex;
        return {
          ...hex,
          narrative: undefined,
          settlement: {
            ...hex.settlement,
            npcs: [...hex.settlement.npcs, generateNpc()],
          },
        };
      }),
    })),

  addRoom: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => {
        if (!hex.adventureSite) return hex;
        const nextNumber = hex.adventureSite.rooms.length + 1;
        return {
          ...hex,
          narrative: undefined,
          adventureSite: {
            ...hex.adventureSite,
            rooms: [...hex.adventureSite.rooms, generateRoom(nextNumber)],
          },
        };
      }),
    })),
}));
