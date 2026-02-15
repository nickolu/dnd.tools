import type { FilterGroupOption } from "@/components/filter-group";
import type {
  MonsterFilterGroupKey,
  MonsterFilters,
  MonsterMatchMode,
  MonsterMultiSelectableGroupKey,
  MonsterRangeFilterGroup,
  MonsterRangeFilterKey,
  MonsterSelectionMode,
  MonsterSizeFilter,
} from "@/page/monsters/types";

export const ALL_FILTER_VALUE = "all";
export const DEFAULT_MATCH_MODE: MonsterMatchMode = "and";
export const DEFAULT_SELECTION_MODE: MonsterSelectionMode = "single";

export const MONSTER_SIZE_VALUES: MonsterSizeFilter[] = [
  "Tiny",
  "Small",
  "Medium",
  "Large",
  "Huge",
  "Gargantuan",
];

export const MONSTER_SIZE_FILTER_OPTIONS: FilterGroupOption[] = [
  { label: "All", value: ALL_FILTER_VALUE },
  ...MONSTER_SIZE_VALUES.map((size) => ({ label: size, value: size })),
];

export const MONSTER_FILTER_GROUP_LABEL_BY_KEY: Record<
  MonsterFilterGroupKey,
  string
> = {
  alignmentLaw: "Alignment (lawful)",
  alignmentMoral: "Alignment (moral)",
  conditionImmunities: "Condition Immunities",
  damageImmunities: "Damage Immunities",
  damageResistances: "Damage Resistances",
  damageVulnerabilities: "Damage Vulnerabilities",
  senses: "Senses",
  size: "Size",
  source: "Source",
  type: "Type",
};

export const MONSTER_FILTER_GROUP_KEYS: MonsterFilterGroupKey[] = [
  "size",
  "type",
  "alignmentLaw",
  "alignmentMoral",
  "source",
  "senses",
  "damageResistances",
  "damageImmunities",
  "damageVulnerabilities",
  "conditionImmunities",
];

export const MONSTER_RANGE_FILTER_KEYS: MonsterRangeFilterKey[] = [
  "crNumeric",
  "armorClass",
  "hitPoints",
  "str",
  "dex",
  "con",
  "int",
  "wis",
  "cha",
];

export const MONSTER_RANGE_FILTER_GROUPS: MonsterRangeFilterGroup[] = [
  { key: "crNumeric", label: "Challenge Rating", options: [] },
  { key: "armorClass", label: "Armor Class", options: [] },
  { key: "hitPoints", label: "Hit Points", options: [] },
  { key: "str", label: "STR", options: [] },
  { key: "dex", label: "DEX", options: [] },
  { key: "con", label: "CON", options: [] },
  { key: "int", label: "INT", options: [] },
  { key: "wis", label: "WIS", options: [] },
  { key: "cha", label: "CHA", options: [] },
];

export const DEFAULT_MONSTER_FILTERS: MonsterFilters = {
  alignmentLaw: [],
  alignmentMoral: [],
  conditionImmunities: [],
  damageImmunities: [],
  damageResistances: [],
  damageVulnerabilities: [],
  groupMatchMode: DEFAULT_MATCH_MODE,
  groupMatchModeByKey: {
    alignmentLaw: "or",
    alignmentMoral: "or",
    conditionImmunities: "or",
    damageImmunities: "or",
    damageResistances: "or",
    damageVulnerabilities: "or",
    senses: "or",
    size: "or",
    source: "or",
    type: "or",
  },
  query: "",
  rangeByKey: {
    armorClass: { max: null, min: null },
    cha: { max: null, min: null },
    con: { max: null, min: null },
    crNumeric: { max: null, min: null },
    dex: { max: null, min: null },
    hitPoints: { max: null, min: null },
    int: { max: null, min: null },
    str: { max: null, min: null },
    wis: { max: null, min: null },
  },
  selectionModeByKey: {
    alignmentLaw: DEFAULT_SELECTION_MODE,
    alignmentMoral: DEFAULT_SELECTION_MODE,
    conditionImmunities: DEFAULT_SELECTION_MODE,
    damageImmunities: DEFAULT_SELECTION_MODE,
    damageResistances: DEFAULT_SELECTION_MODE,
    damageVulnerabilities: DEFAULT_SELECTION_MODE,
    senses: DEFAULT_SELECTION_MODE,
    size: DEFAULT_SELECTION_MODE,
    source: DEFAULT_SELECTION_MODE,
    type: DEFAULT_SELECTION_MODE,
  },
  senses: [],
  size: [],
  source: [],
  type: [],
};

export const MONSTER_FILTER_QUERY_PARAM_BY_KEY: Record<
  MonsterFilterGroupKey,
  string
> = {
  alignmentLaw: "alignmentLaw",
  alignmentMoral: "alignmentMoral",
  conditionImmunities: "conditionImmunities",
  damageImmunities: "damageImmunities",
  damageResistances: "damageResistances",
  damageVulnerabilities: "damageVulnerabilities",
  senses: "senses",
  size: "size",
  source: "source",
  type: "type",
};

export const MONSTER_GROUP_MATCH_QUERY_PARAM = "groupMode";

export const MONSTER_GROUP_MATCH_QUERY_PARAM_BY_KEY: Record<
  MonsterMultiSelectableGroupKey,
  string
> = {
  alignmentLaw: "alignmentLawMode",
  alignmentMoral: "alignmentMoralMode",
  conditionImmunities: "conditionImmunitiesMode",
  damageImmunities: "damageImmunitiesMode",
  damageResistances: "damageResistancesMode",
  damageVulnerabilities: "damageVulnerabilitiesMode",
  senses: "sensesMode",
  size: "sizeMode",
  source: "sourceMode",
  type: "typeMode",
};

export const MONSTER_SELECTION_MODE_QUERY_PARAM_BY_KEY: Record<
  MonsterMultiSelectableGroupKey,
  string
> = {
  alignmentLaw: "alignmentLawSelect",
  alignmentMoral: "alignmentMoralSelect",
  conditionImmunities: "conditionImmunitiesSelect",
  damageImmunities: "damageImmunitiesSelect",
  damageResistances: "damageResistancesSelect",
  damageVulnerabilities: "damageVulnerabilitiesSelect",
  senses: "sensesSelect",
  size: "sizeSelect",
  source: "sourceSelect",
  type: "typeSelect",
};

export const MONSTER_RANGE_QUERY_PARAM_BY_KEY: Record<
  MonsterRangeFilterKey,
  { max: string; min: string }
> = {
  armorClass: { max: "acMax", min: "acMin" },
  cha: { max: "chaMax", min: "chaMin" },
  con: { max: "conMax", min: "conMin" },
  crNumeric: { max: "crMax", min: "crMin" },
  dex: { max: "dexMax", min: "dexMin" },
  hitPoints: { max: "hpMax", min: "hpMin" },
  int: { max: "intMax", min: "intMin" },
  str: { max: "strMax", min: "strMin" },
  wis: { max: "wisMax", min: "wisMin" },
};

export function isMonsterMatchMode(value: string): value is MonsterMatchMode {
  return value === "and" || value === "or";
}

export function isMonsterSelectionMode(
  value: string
): value is MonsterSelectionMode {
  return value === "single" || value === "multi";
}

export function isMonsterSizeFilter(value: string): value is MonsterSizeFilter {
  return MONSTER_SIZE_VALUES.some((size) => size === value);
}
