import { rollDie, matchesRoll } from "./dice";
import { generateMouseName } from "./generate-name";
import type { GeneratedNpc } from "../types";
import npcData from "@/lib/domain/mausritter/data/npcs/non-player-mice.json";

type NpcTableEntry = {
  roll: number | string;
  values: Record<string, string>;
};

export function generateNpc(): GeneratedNpc {
  const socialTable = npcData.tables[0]! as { entries: NpcTableEntry[]; die: string };
  const birthsignTable = npcData.tables[1]! as { entries: NpcTableEntry[]; die: string };
  const traitsTable = npcData.tables[2]! as { entries: NpcTableEntry[]; die: string };

  // Social position
  const socialRoll = rollDie(6);
  const socialEntry = socialTable.entries.find((e) => matchesRoll(e.roll, socialRoll));
  const socialPosition = socialEntry?.values["Social position"] ?? "Common";
  const paymentForService = socialEntry?.values["Payment for service"] ?? "d6 x 10p";

  // Birthsign
  const birthsignRoll = rollDie(6);
  const birthsignEntry = birthsignTable.entries.find((e) => matchesRoll(e.roll, birthsignRoll));
  const birthsign = birthsignEntry?.values["Birthsign"] ?? "Star";
  const disposition = birthsignEntry?.values["Disposition"] ?? "Brave / Reckless";

  // Traits (d20, 4 columns)
  const traitsRoll = rollDie(20);
  const traitsEntry = traitsTable.entries.find((e) => matchesRoll(e.roll, traitsRoll));
  const appearance = traitsEntry?.values["Appearance"] ?? "Soulful eyes";
  const quirk = traitsEntry?.values["Quirk"] ?? "Constantly grooming";
  const wants = traitsEntry?.values["Wants"] ?? "Freedom";
  const relationship = traitsEntry?.values["Relationship"] ?? "Parent";

  return {
    id: crypto.randomUUID(),
    name: generateMouseName(),
    socialPosition,
    paymentForService,
    birthsign,
    disposition,
    appearance,
    quirk,
    wants,
    relationship,
  };
}
