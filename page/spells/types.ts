import type { FilterGroupOption } from "@/components/filter-group";

export type SpellBooleanFilter = "all" | "yes" | "no";
export type SpellComponentFilter = "all" | "verbal" | "somatic" | "material";
export type SpellLevelFilter = "all" | `${number}`;

export type SpellFilters = {
  castingTime: string;
  classes: string;
  component: SpellComponentFilter;
  concentration: SpellBooleanFilter;
  duration: string;
  level: SpellLevelFilter;
  query: string;
  range: string;
  ritual: SpellBooleanFilter;
  source: string;
};

export type SpellFilterGroup = {
  key: keyof Omit<SpellFilters, "query">;
  label: string;
  options: FilterGroupOption[];
};
