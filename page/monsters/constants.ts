import type { MonsterFilters, MonsterSizeFilter } from "@/page/monsters/types";

export const DEFAULT_MONSTER_FILTERS: MonsterFilters = {
  query: "",
  size: "all",
};

export const MONSTER_SIZE_FILTERS: MonsterSizeFilter[] = [
  "all",
  "Tiny",
  "Small",
  "Medium",
  "Large",
  "Huge",
  "Gargantuan",
];
