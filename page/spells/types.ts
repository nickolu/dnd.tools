import type { FilterGroupOption } from "@/components/filter-group";

export type SpellBooleanFilter = "all" | "yes" | "no";
export type SpellComponentFilter = "verbal" | "somatic" | "material";
export type SpellLevelFilter = "all" | `${number}`;
export type SpellMatchMode = "and" | "or";
export type SpellSelectionMode = "single" | "multi";
export type SpellMultiSelectableGroupKey = "classes" | "component";
export type SpellFilterGroupKey =
  | "castingTime"
  | "classes"
  | "component"
  | "concentration"
  | "duration"
  | "level"
  | "range"
  | "ritual"
  | "source";

export type SpellFilters = {
  castingTime: string;
  classes: string[];
  component: SpellComponentFilter[];
  concentration: SpellBooleanFilter;
  duration: string;
  groupMatchMode: SpellMatchMode;
  groupMatchModeByKey: Record<SpellMultiSelectableGroupKey, SpellMatchMode>;
  level: SpellLevelFilter;
  query: string;
  range: string;
  ritual: SpellBooleanFilter;
  selectionModeByKey: Record<SpellMultiSelectableGroupKey, SpellSelectionMode>;
  source: string;
};

export type SpellFilterGroup = {
  key: SpellFilterGroupKey;
  label: string;
  options: FilterGroupOption[];
};
