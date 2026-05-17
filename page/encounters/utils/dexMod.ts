/** Standard 5e ability modifier: floor((score - 10) / 2). */
export function dexModifier(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.floor((score - 10) / 2);
}
