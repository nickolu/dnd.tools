import { create } from "zustand";

import factionsData from "@/lib/domain/mausritter/data/factions/factions.json";
import landmarkDetailsData from "@/lib/domain/mausritter/data/hex-contents/landmark-details.json";
import countrysideData from "@/lib/domain/mausritter/data/hex-contents/landmarks-countryside.json";
import forestData from "@/lib/domain/mausritter/data/hex-contents/landmarks-forest.json";
import humanTownData from "@/lib/domain/mausritter/data/hex-contents/landmarks-human-town.json";
import riverData from "@/lib/domain/mausritter/data/hex-contents/landmarks-river.json";
import eventsData from "@/lib/domain/mausritter/data/settlements/events.json";

import { DEFAULT_CONFIG } from "../constants";
import type {
  GeneratedFaction,
  GeneratedHex,
  HexCrawlConfig,
} from "../types";
import { shuffled } from "../utils/dice";
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

type HexCrawlStore = {
  config: HexCrawlConfig;
  hexes: GeneratedHex[];
  factions: GeneratedFaction[];
  generatedAt: number | null;

  setConfig: (partial: Partial<HexCrawlConfig>) => void;
  generate: () => void;
  clear: () => void;

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

  setConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),

  generate: () => {
    const state = generateHexCrawl(get().config);
    set(state);
  },

  clear: () => set({ hexes: [], factions: [], generatedAt: null }),

  rerollHex: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => {
        const newHex = generateHex(hex.index);
        // Preserve settlement and adventure site
        return { ...newHex, settlement: hex.settlement, adventureSite: hex.adventureSite };
      }),
    })),

  rerollHexLandmark: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => {
        const table = landmarkTableByType[hex.hexType] ?? countrysideData;
        return { ...hex, landmark: rollOnRandomTable(table) };
      }),
    })),

  rerollHexLandmarkDetail: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => ({
        ...hex,
        landmarkDetail: rollOnRandomTable(landmarkDetailsData),
      })),
    })),

  rerollSettlement: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => ({
        ...hex,
        settlement: generateSettlement(state.config.npcsPerSettlement),
      })),
    })),

  rerollSettlementEvent: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => {
        if (!hex.settlement) return hex;
        return {
          ...hex,
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
    const factions: GeneratedFaction[] = shuffled(factionsData.factions).slice(0, config.factionCount);
    set({ factions });
  },

  rerollAdventureSite: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => ({
        ...hex,
        adventureSite: generateAdventureSite(state.config.roomsPerSite),
      })),
    })),

  rerollRoom: (hexId, roomId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => {
        if (!hex.adventureSite) return hex;
        return {
          ...hex,
          adventureSite: {
            ...hex.adventureSite,
            rooms: hex.adventureSite.rooms.map((room) =>
              room.id === roomId
                ? generateRoom(room.roomNumber)
                : room
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
      })),
    })),

  removeSettlement: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => ({
        ...hex,
        settlement: null,
      })),
    })),

  addAdventureSite: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => ({
        ...hex,
        adventureSite: generateAdventureSite(state.config.roomsPerSite),
      })),
    })),

  removeAdventureSite: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => ({
        ...hex,
        adventureSite: null,
      })),
    })),

  addNpc: (hexId) =>
    set((state) => ({
      hexes: updateHex(state.hexes, hexId, (hex) => {
        if (!hex.settlement) return hex;
        return {
          ...hex,
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
          adventureSite: {
            ...hex.adventureSite,
            rooms: [...hex.adventureSite.rooms, generateRoom(nextNumber)],
          },
        };
      }),
    })),
}));
