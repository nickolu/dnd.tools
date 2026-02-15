import type { Monster } from "@/lib/domain/monster.schema";

export type MonsterSizeFilter = Monster["size"] | "all";

export type MonsterFilters = {
  query: string;
  size: MonsterSizeFilter;
};
