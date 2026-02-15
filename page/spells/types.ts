import type { FilterGroupOption } from "@/components/filter-group";

export type SpellBooleanFilter = "all" | "yes" | "no";
export type SpellClassDataFilter = "all" | "present" | "missing";
export type SpellComponentFilter = "verbal" | "somatic" | "material";
export type SpellAttackTypeFilter = "melee" | "ranged";
export type SpellDamageTypeFilter =
  | "acid"
  | "bludgeoning"
  | "cold"
  | "fire"
  | "force"
  | "lightning"
  | "necrotic"
  | "non-magical"
  | "piercing"
  | "poison"
  | "psychic"
  | "radiant"
  | "slashing"
  | "thunder";
export type SpellLevelFilter = "all" | `${number}`;
export type SpellMatchMode = "and" | "or";
export type SpellSelectionMode = "single" | "multi";
export type SpellSaveAbilityFilter = "str" | "dex" | "con" | "int" | "wis" | "cha";
export type SpellSchoolFilter =
  | "abjuration"
  | "conjuration"
  | "divination"
  | "enchantment"
  | "evocation"
  | "illusion"
  | "necromancy"
  | "transmutation";
export type SpellMultiSelectableGroupKey =
  | "attackType"
  | "classes"
  | "component"
  | "damageType"
  | "school"
  | "saveAbility";
export type SpellFilterGroupKey =
  | "attackType"
  | "castingTime"
  | "classData"
  | "classes"
  | "component"
  | "concentration"
  | "damageType"
  | "duration"
  | "level"
  | "range"
  | "ritual"
  | "school"
  | "saveAbility"
  | "source";

export type SpellFilters = {
  attackType: SpellAttackTypeFilter[];
  castingTime: string;
  classData: SpellClassDataFilter;
  classes: string[];
  component: SpellComponentFilter[];
  concentration: SpellBooleanFilter;
  damageType: SpellDamageTypeFilter[];
  duration: string;
  groupMatchMode: SpellMatchMode;
  groupMatchModeByKey: Record<SpellMultiSelectableGroupKey, SpellMatchMode>;
  level: SpellLevelFilter;
  query: string;
  range: string;
  ritual: SpellBooleanFilter;
  school: SpellSchoolFilter[];
  saveAbility: SpellSaveAbilityFilter[];
  selectionModeByKey: Record<SpellMultiSelectableGroupKey, SpellSelectionMode>;
  source: string;
};

export type SpellFilterGroup = {
  key: SpellFilterGroupKey;
  label: string;
  options: FilterGroupOption[];
};
