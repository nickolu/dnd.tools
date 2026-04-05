import { rollDie, matchesRoll } from "./dice";
import { rollOnRandomTable } from "./roll-on-table";
import type { GeneratedHex } from "../types";
import type { RandomTable } from "@/lib/domain/mausritter/schema";
import hexTypeData from "@/lib/domain/mausritter/data/hex-contents/hex-type.json";
import countrysideData from "@/lib/domain/mausritter/data/hex-contents/landmarks-countryside.json";
import forestData from "@/lib/domain/mausritter/data/hex-contents/landmarks-forest.json";
import riverData from "@/lib/domain/mausritter/data/hex-contents/landmarks-river.json";
import humanTownData from "@/lib/domain/mausritter/data/hex-contents/landmarks-human-town.json";
import landmarkDetailsData from "@/lib/domain/mausritter/data/hex-contents/landmark-details.json";

const landmarkTableByType: Record<string, RandomTable> = {
  Countryside: countrysideData as RandomTable,
  Forest: forestData as RandomTable,
  River: riverData as RandomTable,
  "Human town": humanTownData as RandomTable,
};

export function generateHex(index: number): GeneratedHex {
  // Roll hex type
  const typeRoll = rollDie(6);
  const typeEntry = hexTypeData.entries.find((e) => matchesRoll(e.roll, typeRoll));
  const hexType = typeEntry?.result ?? "Countryside";

  // Roll landmark based on hex type
  const landmarkTable = landmarkTableByType[hexType] ?? countrysideData;
  const landmark = rollOnRandomTable(landmarkTable as RandomTable);

  // Roll landmark detail
  const landmarkDetail = rollOnRandomTable(landmarkDetailsData as RandomTable);

  return {
    id: crypto.randomUUID(),
    index,
    hexType,
    landmark,
    landmarkDetail,
    settlement: null,
    adventureSite: null,
  };
}
