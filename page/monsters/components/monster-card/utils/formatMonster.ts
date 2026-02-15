export function formatAbilityModifier(score: number): string {
  const modifier = Math.floor((score - 10) / 2);
  const prefix = modifier >= 0 ? "+" : "";
  return `${prefix}${modifier}`;
}

export function formatList(items: string[] | undefined): string {
  if (!items || !items.length) {
    return "None";
  }

  return items.join(", ");
}
