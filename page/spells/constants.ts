import type { FilterGroupOption } from "@/components/filter-group";
import type {
  SpellAttackTypeFilter,
  SpellBooleanFilter,
  SpellClassDataFilter,
  SpellComponentFilter,
  SpellDamageTypeFilter,
  SpellFilterGroupKey,
  SpellFilters,
  SpellLevelFilter,
  SpellMatchMode,
  SpellMultiSelectableGroupKey,
  SpellSchoolFilter,
  SpellSelectionMode,
} from "@/page/spells/types";

export const ALL_FILTER_VALUE = "all";
export const DEFAULT_MATCH_MODE: SpellMatchMode = "and";
export const DEFAULT_SELECTION_MODE: SpellSelectionMode = "single";

export const DEFAULT_SPELL_FILTERS: SpellFilters = {
  attackType: [],
  castingTime: ALL_FILTER_VALUE,
  classData: ALL_FILTER_VALUE,
  classes: [],
  component: [],
  concentration: ALL_FILTER_VALUE,
  damageType: [],
  duration: ALL_FILTER_VALUE,
  groupMatchMode: DEFAULT_MATCH_MODE,
  groupMatchModeByKey: {
    attackType: "or",
    classes: "or",
    component: "or",
    damageType: "or",
    school: "or",
    saveAbility: "or",
  },
  level: ALL_FILTER_VALUE,
  query: "",
  range: ALL_FILTER_VALUE,
  ritual: ALL_FILTER_VALUE,
  school: [],
  saveAbility: [],
  selectionModeByKey: {
    attackType: DEFAULT_SELECTION_MODE,
    classes: DEFAULT_SELECTION_MODE,
    component: DEFAULT_SELECTION_MODE,
    damageType: DEFAULT_SELECTION_MODE,
    school: DEFAULT_SELECTION_MODE,
    saveAbility: DEFAULT_SELECTION_MODE,
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

export const SPELL_CLASS_DATA_FILTER_OPTIONS: FilterGroupOption[] = [
  { label: "All", value: ALL_FILTER_VALUE },
  { label: "Has classes", value: "present" },
  { label: "Missing classes", value: "missing" },
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

export const SPELL_DAMAGE_TYPE_VALUES: SpellDamageTypeFilter[] = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "non-magical",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
];

export const SPELL_SCHOOL_VALUES: SpellSchoolFilter[] = [
  "abjuration",
  "conjuration",
  "divination",
  "enchantment",
  "evocation",
  "illusion",
  "necromancy",
  "transmutation",
];

export const SPELL_ATTACK_TYPE_VALUES: SpellAttackTypeFilter[] = [
  "melee",
  "ranged",
];

export const SPELL_FILTER_QUERY_PARAM_BY_KEY: Record<
  SpellFilterGroupKey,
  string
> = {
  attackType: "attackType",
  castingTime: "castingTime",
  classData: "classData",
  classes: "classes",
  component: "component",
  concentration: "concentration",
  damageType: "damageType",
  duration: "duration",
  level: "level",
  range: "range",
  ritual: "ritual",
  school: "school",
  saveAbility: "saveAbility",
  source: "source",
};

export const SPELL_GROUP_MATCH_QUERY_PARAM = "groupMode";

export const SPELL_GROUP_MATCH_QUERY_PARAM_BY_KEY: Record<
  SpellMultiSelectableGroupKey,
  string
> = {
  attackType: "attackTypeMode",
  classes: "classesMode",
  component: "componentMode",
  damageType: "damageTypeMode",
  school: "schoolMode",
  saveAbility: "saveAbilityMode",
};

export const SPELL_SELECTION_MODE_QUERY_PARAM_BY_KEY: Record<
  SpellMultiSelectableGroupKey,
  string
> = {
  attackType: "attackTypeSelect",
  classes: "classesSelect",
  component: "componentSelect",
  damageType: "damageTypeSelect",
  school: "schoolSelect",
  saveAbility: "saveAbilitySelect",
};

export function isSpellBooleanFilter(
  value: string
): value is SpellBooleanFilter {
  return value === ALL_FILTER_VALUE || value === "yes" || value === "no";
}

export function isSpellComponentFilter(
  value: string
): value is SpellComponentFilter {
  return value === "verbal" || value === "somatic" || value === "material";
}

export function isSpellClassDataFilter(
  value: string
): value is SpellClassDataFilter {
  return (
    value === ALL_FILTER_VALUE || value === "present" || value === "missing"
  );
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

export function isSpellSelectionMode(
  value: string
): value is SpellSelectionMode {
  return value === "single" || value === "multi";
}

export function isSpellDamageTypeFilter(
  value: string
): value is SpellDamageTypeFilter {
  return SPELL_DAMAGE_TYPE_VALUES.some((type) => type === value);
}

export function isSpellSchoolFilter(value: string): value is SpellSchoolFilter {
  return SPELL_SCHOOL_VALUES.some((school) => school === value);
}

export function isSpellAttackTypeFilter(
  value: string
): value is SpellAttackTypeFilter {
  return SPELL_ATTACK_TYPE_VALUES.some((type) => type === value);
}
