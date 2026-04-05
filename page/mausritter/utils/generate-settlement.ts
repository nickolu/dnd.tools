import eventsData from "@/lib/domain/mausritter/data/settlements/events.json";
import governanceData from "@/lib/domain/mausritter/data/settlements/governance.json";
import industryData from "@/lib/domain/mausritter/data/settlements/industry.json";
import detailsData from "@/lib/domain/mausritter/data/settlements/settlement-details.json";
import sizeData from "@/lib/domain/mausritter/data/settlements/settlement-size.json";

import type { GeneratedSettlement } from "../types";
import { matchesRoll,rollDie } from "./dice";
import { generateSettlementName, generateTavernName } from "./generate-name";
import { generateNpc } from "./generate-npc";
import { rollOnRandomTable } from "./roll-on-table";

// Size index determines governance modifier and industry count
const SIZE_GOVERNANCE_MODIFIER = [0, 0, 1, 2, 3, 4]; // Farm, Crossroads, Hamlet, Village, Town, City
const HAMLET_OR_LARGER_INDEX = 2; // index where taverns start appearing
const TOWN_OR_LARGER_INDEX = 4; // index where 2 industries are assigned

export function generateSettlement(npcsPerSettlement: number): GeneratedSettlement {
  // Settlement size
  const sizeRoll = rollDie(6);
  const sizeEntry = (sizeData).entries.find((e) => matchesRoll(e.roll, sizeRoll));
  const size = sizeEntry?.result ?? (sizeData).entries[0]!.result;
  const sizeIndex = sizeRoll - 1;

  // Governance (d6 + size modifier)
  const govBaseRoll = rollDie(6);
  const govModifier = SIZE_GOVERNANCE_MODIFIER[sizeIndex] ?? 0;
  const govTotal = govBaseRoll + govModifier;
  const govEntry = governanceData.entries.find((e) => matchesRoll(e.roll, govTotal));
  const governance = govEntry?.result ?? governanceData.entries[0]!.result;

  // Settlement detail
  const detail = rollOnRandomTable(detailsData);

  // Industries (1 normally, 2 for town/city)
  const industryCount = sizeIndex >= TOWN_OR_LARGER_INDEX ? 2 : 1;
  const industries: string[] = [];
  for (let i = 0; i < industryCount; i++) {
    industries.push(rollOnRandomTable(industryData));
  }

  // Event
  const event = rollOnRandomTable(eventsData);

  // Tavern (hamlet or larger)
  const tavern = sizeIndex >= HAMLET_OR_LARGER_INDEX ? generateTavernName() : null;

  // NPCs
  const npcs = Array.from({ length: npcsPerSettlement }, () => generateNpc());

  return {
    id: crypto.randomUUID(),
    name: generateSettlementName(),
    size,
    governance,
    detail,
    industries,
    event,
    tavern,
    npcs,
  };
}
