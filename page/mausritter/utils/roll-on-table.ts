import { matchesRoll, parseDie, pickRandom, rollDie } from "./dice";

type TableLike = {
  die: string;
  entries: readonly { roll: number | string; result: string }[];
};

type MultiColumnTableLike = {
  die: string;
  entries: readonly { roll: number | string; values: Record<string, string> }[];
};

type NameGeneratorData = {
  parts: readonly { name: string; die: string; options: readonly string[] }[];
};

export function rollOnRandomTable(table: TableLike): string {
  const sides = parseDie(table.die);
  const roll = rollDie(sides);
  const entry = table.entries.find((e) => matchesRoll(e.roll, roll));
  return entry?.result ?? table.entries[0]!.result;
}

export function rollOnMultiColumnTable(
  table: MultiColumnTableLike
): Record<string, string> {
  const sides = parseDie(table.die);
  const roll = rollDie(sides);
  const entry = table.entries.find((e) => matchesRoll(e.roll, roll));
  return entry?.values ?? table.entries[0]!.values;
}

export function rollOnNameGenerator(generator: NameGeneratorData): string {
  return generator.parts.map((part) => pickRandom(part.options)).join("");
}

export function rollOnRandomTableEntry(table: TableLike): {
  roll: number;
  result: string;
} {
  const sides = parseDie(table.die);
  const roll = rollDie(sides);
  const entry = table.entries.find((e) => matchesRoll(e.roll, roll));
  return { roll, result: entry?.result ?? table.entries[0]!.result };
}
