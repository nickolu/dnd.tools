import type { SpellFilters, SpellSchoolFilter } from "@/page/spells/types";

export const DEFAULT_SPELL_FILTERS: SpellFilters = {
  query: "",
  school: "all",
};

export const SPELL_SCHOOL_FILTERS: SpellSchoolFilter[] = [
  "all",
  "abjuration",
  "conjuration",
  "divination",
  "enchantment",
  "evocation",
  "illusion",
  "necromancy",
  "transmutation",
];
