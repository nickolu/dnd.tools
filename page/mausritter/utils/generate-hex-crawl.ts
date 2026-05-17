import factionsData from "@/lib/domain/mausritter/data/factions/factions.json";
import { shuffled } from "@/lib/util/dice";

import type { GeneratedFaction, HexCrawlConfig, HexCrawlState } from "../types";
import { generateAdventureSite } from "./generate-adventure-site";
import { generateHex } from "./generate-hex";
import { generateSettlement } from "./generate-settlement";

const SETTLEMENT_CHANCE_NON_TOWN = 0.15;

export function generateHexCrawl(config: HexCrawlConfig): HexCrawlState {
  // Generate hexes
  const hexes = Array.from({ length: config.hexCount }, (_, i) =>
    generateHex(i + 1)
  );

  // Hex 1 (center) is always a mouse settlement
  hexes[0]!.settlement = generateSettlement(config.npcsPerSettlement);

  // Place settlements on Human town hexes, and randomly on some others
  for (const hex of hexes.slice(1)) {
    if (hex.hexType === "Human town") {
      hex.settlement = generateSettlement(config.npcsPerSettlement);
    } else if (Math.random() < SETTLEMENT_CHANCE_NON_TOWN) {
      hex.settlement = generateSettlement(config.npcsPerSettlement);
    }
  }

  // Pick random factions
  const selectedFactions: GeneratedFaction[] = shuffled(
    factionsData.factions
  ).slice(0, config.factionCount);

  // Distribute adventure sites across hexes without settlements
  const eligibleHexes = shuffled(hexes.filter((h) => !h.settlement));
  const sitesToPlace = Math.min(
    config.adventureSiteCount,
    eligibleHexes.length
  );
  for (let i = 0; i < sitesToPlace; i++) {
    eligibleHexes[i]!.adventureSite = generateAdventureSite(
      config.roomsPerSite
    );
  }

  return {
    config,
    hexes,
    factions: selectedFactions,
    generatedAt: Date.now(),
    lore: null,
  };
}
