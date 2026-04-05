import constructionData from "@/lib/domain/mausritter/data/adventure-sites/construction.json";
import inhabitantsData from "@/lib/domain/mausritter/data/adventure-sites/inhabitants.json";
import ruinationData from "@/lib/domain/mausritter/data/adventure-sites/ruination.json";
import searchingForData from "@/lib/domain/mausritter/data/adventure-sites/searching-for.json";
import secretData from "@/lib/domain/mausritter/data/adventure-sites/secret.json";

import type { GeneratedAdventureSite } from "../types";
import { generateRoom } from "./generate-room";
import { rollOnRandomTable } from "./roll-on-table";

export function generateAdventureSite(roomCount: number): GeneratedAdventureSite {
  return {
    id: crypto.randomUUID(),
    construction: rollOnRandomTable(constructionData ),
    inhabitants: rollOnRandomTable(inhabitantsData ),
    ruination: rollOnRandomTable(ruinationData ),
    searchingFor: rollOnRandomTable(searchingForData ),
    secret: rollOnRandomTable(secretData ),
    rooms: Array.from({ length: roomCount }, (_, i) => generateRoom(i + 1)),
  };
}
