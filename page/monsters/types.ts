import type { FilterGroupOption } from "@/components/filter-group";
import type { Monster } from "@/lib/domain/monster.schema";

export type MonsterMatchMode = "and" | "or";
export type MonsterSelectionMode = "single" | "multi";
export type MonsterSizeFilter = Monster["size"];

export type MonsterFilterGroupKey =
  | "alignmentLaw"
  | "alignmentMoral"
  | "conditionImmunities"
  | "damageImmunities"
  | "damageResistances"
  | "damageVulnerabilities"
  | "senses"
  | "size"
  | "source"
  | "type";

export type MonsterMultiSelectableGroupKey = MonsterFilterGroupKey;

export type MonsterRangeFilterKey =
  | "armorClass"
  | "cha"
  | "con"
  | "crNumeric"
  | "dex"
  | "hitPoints"
  | "int"
  | "str"
  | "wis";

export type MonsterRangeFilter = {
  max: number | null;
  min: number | null;
};

export type MonsterRangeFilters = Record<
  MonsterRangeFilterKey,
  MonsterRangeFilter
>;

export type MonsterFilters = {
  alignmentLaw: string[];
  alignmentMoral: string[];
  conditionImmunities: string[];
  damageImmunities: string[];
  damageResistances: string[];
  damageVulnerabilities: string[];
  groupMatchMode: MonsterMatchMode;
  groupMatchModeByKey: Record<MonsterMultiSelectableGroupKey, MonsterMatchMode>;
  query: string;
  rangeByKey: MonsterRangeFilters;
  selectionModeByKey: Record<
    MonsterMultiSelectableGroupKey,
    MonsterSelectionMode
  >;
  senses: string[];
  size: MonsterSizeFilter[];
  source: string[];
  type: string[];
};

export type MonsterFilterGroup = {
  key: MonsterFilterGroupKey;
  label: string;
  options: FilterGroupOption[];
};

export type MonsterRangeFilterGroup = {
  key: MonsterRangeFilterKey;
  label: string;
  options: number[];
};
