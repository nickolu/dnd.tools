import hexTypeData from "@/lib/domain/mausritter/data/hex-contents/hex-type.json";
import landmarkDetailsData from "@/lib/domain/mausritter/data/hex-contents/landmark-details.json";
import countrysideData from "@/lib/domain/mausritter/data/hex-contents/landmarks-countryside.json";
import forestData from "@/lib/domain/mausritter/data/hex-contents/landmarks-forest.json";
import humanTownData from "@/lib/domain/mausritter/data/hex-contents/landmarks-human-town.json";
import riverData from "@/lib/domain/mausritter/data/hex-contents/landmarks-river.json";

import type { GeneratedHex } from "../types";
import { matchesRoll,rollDie } from "./dice";
import { rollOnRandomTable } from "./roll-on-table";

const landmarkTableByType: Record<string, typeof countrysideData> = {
  Countryside: countrysideData,
  Forest: forestData,
  River: riverData,
  "Human town": humanTownData,
};

export function generateHex(index: number): GeneratedHex {
  // Roll hex type
  const typeRoll = rollDie(6);
  const typeEntry = hexTypeData.entries.find((e) => matchesRoll(e.roll, typeRoll));
  const hexType = typeEntry?.result ?? "Countryside";

  // Roll landmark based on hex type
  const landmarkTable = landmarkTableByType[hexType] ?? countrysideData;
  const landmark = rollOnRandomTable(landmarkTable);

  // Roll landmark detail
  const landmarkDetail = rollOnRandomTable(landmarkDetailsData);

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
