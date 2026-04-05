import emptyRoomFeaturesData from "@/lib/domain/mausritter/data/adventure-sites/empty-room-features.json";
import lairData from "@/lib/domain/mausritter/data/adventure-sites/lair.json";
import obstacleData from "@/lib/domain/mausritter/data/adventure-sites/obstacle.json";
import puzzleData from "@/lib/domain/mausritter/data/adventure-sites/puzzle.json";
import roomStockingData from "@/lib/domain/mausritter/data/adventure-sites/room-stocking.json";
import trapData from "@/lib/domain/mausritter/data/adventure-sites/trap.json";

import type { GeneratedRoom } from "../types";
import { matchesRoll, rollDie } from "./dice";
import { generateTreasure } from "./generate-treasure";
import { rollOnRandomTable } from "./roll-on-table";

const featureTableByType: Record<string, typeof emptyRoomFeaturesData> = {
  Empty: emptyRoomFeaturesData,
  Obstacle: obstacleData,
  Trap: trapData,
  Puzzle: puzzleData,
  Lair: lairData,
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
