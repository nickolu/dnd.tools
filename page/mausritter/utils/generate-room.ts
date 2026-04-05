import { rollDie, matchesRoll } from "./dice";
import { rollOnRandomTable } from "./roll-on-table";
import { generateTreasure } from "./generate-treasure";
import type { GeneratedRoom } from "../types";
import type { RandomTable } from "@/lib/domain/mausritter/schema";
import roomStockingData from "@/lib/domain/mausritter/data/adventure-sites/room-stocking.json";
import emptyRoomFeaturesData from "@/lib/domain/mausritter/data/adventure-sites/empty-room-features.json";
import obstacleData from "@/lib/domain/mausritter/data/adventure-sites/obstacle.json";
import trapData from "@/lib/domain/mausritter/data/adventure-sites/trap.json";
import puzzleData from "@/lib/domain/mausritter/data/adventure-sites/puzzle.json";
import lairData from "@/lib/domain/mausritter/data/adventure-sites/lair.json";

const featureTableByType: Record<string, RandomTable> = {
  Empty: emptyRoomFeaturesData as RandomTable,
  Obstacle: obstacleData as RandomTable,
  Trap: trapData as RandomTable,
  Puzzle: puzzleData as RandomTable,
  Lair: lairData as RandomTable,
};

export function generateRoom(roomNumber: number): GeneratedRoom {
  // Roll room type
  const typeRoll = rollDie(6);
  const roomTypeEntry = roomStockingData.roomTypes.find((rt) =>
    matchesRoll(rt.roll, typeRoll)
  );
  const roomType = roomTypeEntry?.type ?? "Empty";

  // Roll creature presence
  const creatureRoll = rollDie(6);
  const hasCreature = roomTypeEntry?.creature.includes(creatureRoll) ?? false;

  // Roll treasure presence
  const treasureRoll = rollDie(6);
  const hasTreasure = roomTypeEntry?.treasure.includes(treasureRoll) ?? false;

  // Roll on feature sub-table
  const featureTable = featureTableByType[roomType];
  const feature = featureTable ? rollOnRandomTable(featureTable) : "";

  // Generate treasure if present
  const treasure = hasTreasure ? generateTreasure() : null;

  return {
    id: crypto.randomUUID(),
    roomNumber,
    roomType,
    hasCreature,
    hasTreasure,
    feature,
    treasure,
  };
}
