import mousyNamesData from "@/lib/domain/mausritter/data/reference/mousy-names.json";
import settlementNamesData from "@/lib/domain/mausritter/data/settlements/settlement-names.json";
import tavernNamesData from "@/lib/domain/mausritter/data/settlements/tavern-names.json";

import { pickRandom } from "./dice";

export function generateSettlementName(): string {
  const parts = settlementNamesData.parts;
  const startList = Math.random() < 0.5 ? parts[0]! : parts[1]!;
  const endList = Math.random() < 0.5 ? parts[2]! : parts[3]!;
  return pickRandom(startList.options) + pickRandom(endList.options);
}

export function generateTavernName(): { name: string; specialtyMeal: string } {
  const parts = tavernNamesData.parts;
  const nameA = pickRandom(parts[0]!.options);
  const nameB = pickRandom(parts[1]!.options);
  const meal = pickRandom(parts[2]!.options);
  return {
    name: `The ${nameA} ${nameB}`,
    specialtyMeal: meal,
  };
}

export function generateMouseName(): string {
  const parts = mousyNamesData.parts;
  const birthname = pickRandom(parts[0]!.options);
  const matriname = pickRandom(parts[1]!.options);
  return `${birthname} ${matriname}`;
}
