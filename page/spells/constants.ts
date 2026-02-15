import type { FilterGroupOption } from "@/components/filter-group";
import type {
  SpellBooleanFilter,
  SpellComponentFilter,
  SpellFilterGroupKey,
  SpellFilters,
  SpellLevelFilter,
  SpellMatchMode,
  SpellMultiSelectableGroupKey,
  SpellSelectionMode,
} from "@/page/spells/types";

export const ALL_FILTER_VALUE = "all";
export const DEFAULT_MATCH_MODE: SpellMatchMode = "and";
export const DEFAULT_SELECTION_MODE: SpellSelectionMode = "single";

export const DEFAULT_SPELL_FILTERS: SpellFilters = {
  castingTime: ALL_FILTER_VALUE,
  classes: [],
  component: [],
  concentration: ALL_FILTER_VALUE,
  duration: ALL_FILTER_VALUE,
  groupMatchMode: DEFAULT_MATCH_MODE,
  groupMatchModeByKey: {
    classes: "or",
    component: "or",
  },
  level: ALL_FILTER_VALUE,
  query: "",
  range: ALL_FILTER_VALUE,
  ritual: ALL_FILTER_VALUE,
  selectionModeByKey: {
    classes: DEFAULT_SELECTION_MODE,
    component: DEFAULT_SELECTION_MODE,
  },
  source: ALL_FILTER_VALUE,
};

export const SPELL_BOOLEAN_FILTER_OPTIONS: FilterGroupOption[] = [
  { label: "All", value: ALL_FILTER_VALUE },
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

export const SPELL_COMPONENT_FILTER_OPTIONS: FilterGroupOption[] = [
  { label: "All", value: ALL_FILTER_VALUE },
  { label: "Verbal", value: "verbal" },
  { label: "Somatic", value: "somatic" },
  { label: "Material", value: "material" },
];

export const SPELL_LEVEL_FILTER_OPTIONS: FilterGroupOption[] = [
  { label: "All", value: ALL_FILTER_VALUE },
  { label: "Cantrip", value: "0" },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
  { label: "6", value: "6" },
  { label: "7", value: "7" },
  { label: "8", value: "8" },
  { label: "9", value: "9" },
];

export const SPELL_FILTER_QUERY_PARAM_BY_KEY: Record<SpellFilterGroupKey, string> = {
  castingTime: "castingTime",
  classes: "classes",
  component: "component",
  concentration: "concentration",
  duration: "duration",
  level: "level",
  range: "range",
  ritual: "ritual",
  source: "source",
};

export const SPELL_GROUP_MATCH_QUERY_PARAM = "groupMode";

export const SPELL_GROUP_MATCH_QUERY_PARAM_BY_KEY: Record<
  SpellMultiSelectableGroupKey,
  string
> = {
  classes: "classesMode",
  component: "componentMode",
};

export const SPELL_SELECTION_MODE_QUERY_PARAM_BY_KEY: Record<
  SpellMultiSelectableGroupKey,
  string
> = {
  classes: "classesSelect",
  component: "componentSelect",
};

export function isSpellBooleanFilter(value: string): value is SpellBooleanFilter {
  return value === ALL_FILTER_VALUE || value === "yes" || value === "no";
}

export function isSpellComponentFilter(
  value: string
): value is SpellComponentFilter {
  return value === "verbal" || value === "somatic" || value === "material";
}

export function isSpellLevelFilter(value: string): value is SpellLevelFilter {
  if (value === ALL_FILTER_VALUE) {
    return true;
  }

  const level = Number(value);
  return Number.isInteger(level) && level >= 0 && level <= 9;
}

export function isSpellMatchMode(value: string): value is SpellMatchMode {
  return value === "and" || value === "or";
}

export function isSpellSelectionMode(value: string): value is SpellSelectionMode {
  return value === "single" || value === "multi";
}
