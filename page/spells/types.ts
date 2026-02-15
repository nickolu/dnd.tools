import type { Spell } from "@/lib/domain/spell.schema";

export type SpellSchoolFilter = Spell["school"] | "all";

export type SpellFilters = {
  query: string;
  school: SpellSchoolFilter;
};
