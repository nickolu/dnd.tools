import type { Monster } from "@/lib/domain/monster.schema";
import type { MonsterFilterGroupKey } from "@/page/monsters/types";

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function singularize(value: string): string {
  if (value.endsWith("ies")) {
    return `${value.slice(0, -3)}y`;
  }

  if (value.endsWith("ses")) {
    return value.slice(0, -2);
  }

  if (value.endsWith("s") && value.length > 3) {
    return value.slice(0, -1);
  }

  return value;
}

function hasToken(alignment: string, token: string): boolean {
  const normalized = ` ${alignment} `;
  return normalized.includes(` ${token} `);
}

function hasNegatedToken(alignment: string, token: string): boolean {
  return alignment.includes(`non-${token}`);
}

function getAxisValuesFromAlignment(
  alignmentValue: string,
  axis: "law" | "moral"
): string[] {
  const alignment = normalizeText(alignmentValue);

  if (!alignment || alignment === "unaligned") {
    return [];
  }

  const values = new Set<string>();

  if (alignment.includes("any alignment")) {
    if (axis === "law") {
      values.add("lawful");
      values.add("neutral");
      values.add("chaotic");
    } else {
      values.add("good");
      values.add("neutral");
      values.add("evil");
    }
    return [...values];
  }

  if (axis === "law") {
    if (alignment.includes("any chaotic alignment")) {
      values.add("chaotic");
    }

    if (alignment.includes("any lawful alignment")) {
      values.add("lawful");
    }

    if (hasNegatedToken(alignment, "lawful")) {
      values.add("neutral");
      values.add("chaotic");
    }

    if (hasNegatedToken(alignment, "chaotic")) {
      values.add("lawful");
      values.add("neutral");
    }

    if (hasNegatedToken(alignment, "neutral")) {
      values.add("lawful");
      values.add("chaotic");
    }

    if (
      hasToken(alignment, "lawful") &&
      !hasNegatedToken(alignment, "lawful")
    ) {
      values.add("lawful");
    }

    if (
      hasToken(alignment, "chaotic") &&
      !hasNegatedToken(alignment, "chaotic")
    ) {
      values.add("chaotic");
    }

    if (
      hasToken(alignment, "neutral") &&
      !hasNegatedToken(alignment, "neutral")
    ) {
      values.add("neutral");
    }

    return [...values];
  }

  if (alignment.includes("any good alignment")) {
    values.add("good");
  }

  if (alignment.includes("any evil alignment")) {
    values.add("evil");
  }

  if (hasNegatedToken(alignment, "good")) {
    values.add("neutral");
    values.add("evil");
  }

  if (hasNegatedToken(alignment, "evil")) {
    values.add("good");
    values.add("neutral");
  }

  if (hasNegatedToken(alignment, "neutral")) {
    values.add("good");
    values.add("evil");
  }

  if (hasToken(alignment, "good") && !hasNegatedToken(alignment, "good")) {
    values.add("good");
  }

  if (hasToken(alignment, "evil") && !hasNegatedToken(alignment, "evil")) {
    values.add("evil");
  }

  if (
    hasToken(alignment, "neutral") &&
    !hasNegatedToken(alignment, "neutral")
  ) {
    values.add("neutral");
  }

  return [...values];
}

export function parseLeadingInteger(value: string): number | null {
  const match = value.match(/\d+/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getArmorClassValue(monster: Monster): number | null {
  return parseLeadingInteger(monster.armorClass);
}

export function getHitPointsValue(monster: Monster): number | null {
  return parseLeadingInteger(monster.hitPoints);
}

export function getMonsterTypeValue(monster: Monster): string {
  const normalized = normalizeText(monster.type);
  const withoutDetails = normalized.split("(")[0]?.trim() ?? normalized;

  if (!withoutDetails.startsWith("swarm of ")) {
    return withoutDetails;
  }

  const parts = withoutDetails.split(" ").filter(Boolean);
  const candidate = parts[parts.length - 1] ?? withoutDetails;
  return singularize(candidate);
}

export function getAlignmentLawValues(monster: Monster): string[] {
  return getAxisValuesFromAlignment(monster.alignment, "law");
}

export function getAlignmentMoralValues(monster: Monster): string[] {
  return getAxisValuesFromAlignment(monster.alignment, "moral");
}

export function getAlignmentLawValuesFromText(alignment: string): string[] {
  return getAxisValuesFromAlignment(alignment, "law");
}

export function getAlignmentMoralValuesFromText(alignment: string): string[] {
  return getAxisValuesFromAlignment(alignment, "moral");
}

export function getSenseValues(monster: Monster): string[] {
  if (!monster.senses) {
    return [];
  }

  return [
    ...new Set(
      monster.senses
        .split(",")
        .map((entry) => entry.replace(/\(.*?\)/g, ""))
        .map((entry) => {
          const normalized = normalizeText(entry);
          const match = normalized.match(/^[a-z\- '\/]+/i);
          return match ? normalizeText(match[0]) : "";
        })
        .filter(Boolean)
    ),
  ];
}

export function getGroupValuesByKey(
  monster: Monster,
  key: MonsterFilterGroupKey
): string[] {
  if (key === "size") {
    return [monster.size];
  }

  if (key === "type") {
    return [getMonsterTypeValue(monster)];
  }

  if (key === "alignmentLaw") {
    return getAlignmentLawValues(monster);
  }

  if (key === "alignmentMoral") {
    return getAlignmentMoralValues(monster);
  }

  if (key === "source") {
    return [monster.source];
  }

  if (key === "senses") {
    return getSenseValues(monster);
  }

  if (key === "damageResistances") {
    return monster.damageResistances ?? [];
  }

  if (key === "damageImmunities") {
    return monster.damageImmunities ?? [];
  }

  if (key === "damageVulnerabilities") {
    return monster.damageVulnerabilities ?? [];
  }

  return monster.conditionImmunities ?? [];
}

export function getMonsterNumericValue(
  monster: Monster,
  key:
    | "armorClass"
    | "cha"
    | "con"
    | "crNumeric"
    | "dex"
    | "hitPoints"
    | "int"
    | "str"
    | "wis"
): number | null {
  if (key === "crNumeric") {
    return monster.crNumeric;
  }

  if (key === "armorClass") {
    return getArmorClassValue(monster);
  }

  if (key === "hitPoints") {
    return getHitPointsValue(monster);
  }

  return monster.abilityScores[key];
}

export function toSentenceCase(value: string): string {
  if (!value.length) {
    return value;
  }

  return `${value[0]?.toUpperCase()}${value.slice(1)}`;
}

export function formatChallengeRating(value: number): string {
  if (value === 0.125) {
    return "1/8";
  }

  if (value === 0.25) {
    return "1/4";
  }

  if (value === 0.5) {
    return "1/2";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
