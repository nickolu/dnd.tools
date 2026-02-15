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

const toTitleCase = (value: string): string =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(
      (part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1).toLowerCase()}`
    )
    .join(" ");

export function formatSkillBonuses(
  skills: Record<string, number> | undefined
): string {
  if (!skills || !Object.keys(skills).length) {
    return "None";
  }

  return Object.entries(skills)
    .filter(([, bonus]) => Number.isInteger(bonus))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([skill, bonus]) =>
        `${toTitleCase(skill)} ${bonus >= 0 ? "+" : ""}${bonus}`
    )
    .join(", ");
}

export function inferProficiencyBonus(crNumeric: number): number {
  if (crNumeric >= 29) {
    return 9;
  }
  if (crNumeric >= 25) {
    return 8;
  }
  if (crNumeric >= 21) {
    return 7;
  }
  if (crNumeric >= 17) {
    return 6;
  }
  if (crNumeric >= 13) {
    return 5;
  }
  if (crNumeric >= 9) {
    return 4;
  }
  if (crNumeric >= 5) {
    return 3;
  }
  return 2;
}
