import magicSwordsData from "@/lib/domain/mausritter/data/treasure/magic-swords.json";
import treasureData from "@/lib/domain/mausritter/data/treasure/treasure-tables.json";
import { matchesRoll, pickRandom, rollDie } from "@/lib/util/dice";

import type { GeneratedMagicSword, GeneratedTreasure } from "../types";

function findTable(id: string) {
  return treasureData.tables.find((t) => t.id === id);
}

function rollOnSubTable(tableId: string): string {
  const table = findTable(tableId);
  if (!table) return "Unknown treasure";
  const roll = rollDie(6);
  const entry = table.entries.find((e) => matchesRoll(e.roll, roll));
  return entry?.result ?? table.entries[0]!.result;
}

function generateMagicSword(): GeneratedMagicSword {
  const weaponClassRoll = rollDie(6);
  const weaponClassEntry = magicSwordsData.weaponClass.entries.find((e) =>
    matchesRoll(e.roll, weaponClassRoll)
  );
  const weaponClass =
    weaponClassEntry?.result ?? magicSwordsData.weaponClass.entries[0]!.result;

  const sword = pickRandom(magicSwordsData.swords);

  const curseRoll = rollDie(6);
  const isCursed = curseRoll === 1;
  let curse: string | null = null;
  let curseLiftedBy: string | null = null;

  if (isCursed) {
    const curseEntry = pickRandom(magicSwordsData.curses.entries);
    curse = curseEntry.curse;
    curseLiftedBy = curseEntry.liftedBy;
  }

  return {
    weaponClass,
    name: sword.name,
    trigger: sword.trigger ?? "",
    effect: sword.effect,
    isCursed,
    curse,
    curseLiftedBy,
  };
}

export function generateTreasure(): GeneratedTreasure {
  const typeTable = findTable("treasure-type");
  if (!typeTable) {
    return { type: "No treasure", detail: "", magicSword: null };
  }

  const typeRoll = rollDie(6);
  const typeEntry = typeTable.entries.find((e) =>
    matchesRoll(e.roll, typeRoll)
  );
  const typeResult = typeEntry?.result ?? "No treasure";

  if (typeResult === "No treasure") {
    return { type: "No treasure", detail: "", magicSword: null };
  }

  if (typeResult === "Magic sword") {
    const sword = generateMagicSword();
    return { type: "Magic sword", detail: sword.name, magicSword: sword };
  }

  const subTableMap: Record<string, string> = {
    "Roll for trinket treasure": "trinkets",
    "Roll for useful treasure": "useable-treasure",
    "Roll for large treasure": "large-treasure",
    "Roll for unusual treasure": "unusual-treasure",
  };

  const subTableId = subTableMap[typeResult];
  if (subTableId) {
    const detail = rollOnSubTable(subTableId);
    return {
      type: typeResult.replace("Roll for ", "").replace(" treasure", ""),
      detail,
      magicSword: null,
    };
  }

  return { type: typeResult, detail: "", magicSword: null };
}
