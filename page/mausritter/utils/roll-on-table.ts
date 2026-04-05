import type { RandomTable, MultiColumnTable } from "@/lib/domain/mausritter/schema";
import { rollDie, parseDie, matchesRoll, pickRandom } from "./dice";

type NameGeneratorData = {
  parts: readonly { name: string; die: string; options: readonly string[] }[];
};

export function rollOnRandomTable(table: RandomTable): string {
  const sides = parseDie(table.die);
  const roll = rollDie(sides);
  const entry = table.entries.find((e) => matchesRoll(e.roll, roll));
  return entry?.result ?? table.entries[0]!.result;
}

export function rollOnMultiColumnTable(
  table: MultiColumnTable
): Record<string, string> {
  const sides = parseDie(table.die);
  const roll = rollDie(sides);
  const entry = table.entries.find((e) => matchesRoll(e.roll, roll));
  return entry?.values ?? table.entries[0]!.values;
}

export function rollOnNameGenerator(generator: NameGeneratorData): string {
  return generator.parts.map((part) => pickRandom(part.options)).join("");
}

export function rollOnRandomTableEntry(table: RandomTable): {
  roll: number;
  result: string;
} {
  const sides = parseDie(table.die);
  const roll = rollDie(sides);
  const entry = table.entries.find((e) => matchesRoll(e.roll, roll));
  return { roll, result: entry?.result ?? table.entries[0]!.result };
}
