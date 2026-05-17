/**
 * Extracts the leading integer from a monster `hitPoints` string such as
 * `"45 (7d10 + 14)"`. Returns `1` as a safety floor for unparseable or
 * non-positive values so combatants always have at least 1 HP.
 */
export function parseHitPoints(raw: string): number {
  const match = raw.trim().match(/^(\d+)/);
  if (!match || !match[1]) return 1;
  const n = Number.parseInt(match[1], 10);
  return n > 0 ? n : 1;
}
