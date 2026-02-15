import type { FilterGroupOption } from "@/components/filter-group";
import type { Monster } from "@/lib/domain/monster.schema";
import {
  ALL_FILTER_VALUE,
  MONSTER_SIZE_FILTER_OPTIONS,
} from "@/page/monsters/constants";
import type { MonsterFilterGroup } from "@/page/monsters/types";
import {
  getAlignmentLawValues,
  getAlignmentMoralValues,
  getMonsterTypeValue,
  getSenseValues,
  toSentenceCase,
} from "@/page/monsters/utils/monster-filter-values";

function sortValues(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function toOptions(values: Iterable<string>): FilterGroupOption[] {
  const sorted = sortValues(values);

  return [
    { label: "All", value: ALL_FILTER_VALUE },
    ...sorted.map((value) => ({
      label: toSentenceCase(value),
      value,
    })),
  ];
}

function getDamageResistances(monsters: Monster[]): string[] {
  return monsters.flatMap((monster) => monster.damageResistances ?? []);
}

function getDamageImmunities(monsters: Monster[]): string[] {
  return monsters.flatMap((monster) => monster.damageImmunities ?? []);
}

function getDamageVulnerabilities(monsters: Monster[]): string[] {
  return monsters.flatMap((monster) => monster.damageVulnerabilities ?? []);
}

function getConditionImmunities(monsters: Monster[]): string[] {
  return monsters.flatMap((monster) => monster.conditionImmunities ?? []);
}

export function getMonsterFilterGroups(
  monsters: Monster[]
): MonsterFilterGroup[] {
  return [
    {
      key: "size",
      label: "Size",
      options: MONSTER_SIZE_FILTER_OPTIONS,
    },
    {
      key: "type",
      label: "Type",
      options: toOptions(
        monsters.map((monster) => getMonsterTypeValue(monster))
      ),
    },
    {
      key: "alignmentLaw",
      label: "Alignment (lawful)",
      options: toOptions(
        monsters.flatMap((monster) => getAlignmentLawValues(monster))
      ),
    },
    {
      key: "alignmentMoral",
      label: "Alignment (moral)",
      options: toOptions(
        monsters.flatMap((monster) => getAlignmentMoralValues(monster))
      ),
    },
    {
      key: "source",
      label: "Source",
      options: toOptions(monsters.map((monster) => monster.source)),
    },
    {
      key: "senses",
      label: "Senses",
      options: toOptions(
        monsters.flatMap((monster) => getSenseValues(monster))
      ),
    },
    {
      key: "damageResistances",
      label: "Damage Resistances",
      options: toOptions(getDamageResistances(monsters)),
    },
    {
      key: "damageImmunities",
      label: "Damage Immunities",
      options: toOptions(getDamageImmunities(monsters)),
    },
    {
      key: "damageVulnerabilities",
      label: "Damage Vulnerabilities",
      options: toOptions(getDamageVulnerabilities(monsters)),
    },
    {
      key: "conditionImmunities",
      label: "Condition Immunities",
      options: toOptions(getConditionImmunities(monsters)),
    },
  ];
}
