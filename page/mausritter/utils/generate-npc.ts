import npcData from "@/lib/domain/mausritter/data/npcs/non-player-mice.json";
import { matchesRoll, rollDie } from "@/lib/util/dice";

import type { GeneratedNpc } from "../types";
import { generateMouseName } from "./generate-name";

function getVal(
  entry: { values: Record<string, string> } | undefined,
  key: string,
  fallback: string
): string {
  if (!entry) return fallback;
  return entry.values[key] ?? fallback;
}

function rollOnNpcTable(tableIndex: number, sides: number) {
  const entries = npcData.tables[tableIndex]!.entries;
  const roll = rollDie(sides);
  return entries.find((e) => matchesRoll(e.roll, roll)) ?? entries[0]!;
}

export function generateNpc(): GeneratedNpc {
  const social = rollOnNpcTable(0, 6);
  const birth = rollOnNpcTable(1, 6);
  const traits = rollOnNpcTable(2, 20);

  return {
    id: crypto.randomUUID(),
    name: generateMouseName(),
    socialPosition: getVal(social, "Social position", "Common"),
    paymentForService: getVal(social, "Payment for service", "d6 x 10p"),
    birthsign: getVal(birth, "Birthsign", "Star"),
    disposition: getVal(birth, "Disposition", "Brave / Reckless"),
    appearance: getVal(traits, "Appearance", "Soulful eyes"),
    quirk: getVal(traits, "Quirk", "Constantly grooming"),
    wants: getVal(traits, "Wants", "Freedom"),
    relationship: getVal(traits, "Relationship", "Parent"),
  };
}
