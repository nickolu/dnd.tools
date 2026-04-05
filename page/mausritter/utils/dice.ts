export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function parseDie(dieStr: string): number {
  const match = dieStr.match(/^d(\d+)\+?$/);
  if (!match) throw new Error(`Invalid die string: ${dieStr}`);
  return Number(match[1]);
}

export function matchesRoll(
  entryRoll: number | string,
  rolledValue: number
): boolean {
  if (typeof entryRoll === "number") {
    return entryRoll === rolledValue;
  }
  const rangeMatch = entryRoll.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    const low = Number(rangeMatch[1]);
    const high = Number(rangeMatch[2]);
    return rolledValue >= low && rolledValue <= high;
  }
  return Number(entryRoll) === rolledValue;
}

export function pickRandom<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

export function shuffled<T>(array: readonly T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}
