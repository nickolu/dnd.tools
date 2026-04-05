import { rollOnRandomTable } from "./roll-on-table";
import { generateRoom } from "./generate-room";
import type { GeneratedAdventureSite } from "../types";
import type { RandomTable } from "@/lib/domain/mausritter/schema";
import constructionData from "@/lib/domain/mausritter/data/adventure-sites/construction.json";
import inhabitantsData from "@/lib/domain/mausritter/data/adventure-sites/inhabitants.json";
import ruinationData from "@/lib/domain/mausritter/data/adventure-sites/ruination.json";
import searchingForData from "@/lib/domain/mausritter/data/adventure-sites/searching-for.json";
import secretData from "@/lib/domain/mausritter/data/adventure-sites/secret.json";

export function generateAdventureSite(roomCount: number): GeneratedAdventureSite {
  return {
    id: crypto.randomUUID(),
    construction: rollOnRandomTable(constructionData as RandomTable),
    inhabitants: rollOnRandomTable(inhabitantsData as RandomTable),
    ruination: rollOnRandomTable(ruinationData as RandomTable),
    searchingFor: rollOnRandomTable(searchingForData as RandomTable),
    secret: rollOnRandomTable(secretData as RandomTable),
    rooms: Array.from({ length: roomCount }, (_, i) => generateRoom(i + 1)),
  };
}
