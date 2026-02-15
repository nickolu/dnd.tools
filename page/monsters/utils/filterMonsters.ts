import type { Monster } from "@/lib/domain/monster.schema";
import type { MonsterFilters } from "@/page/monsters/types";

function hasActiveMonsterFilters(filters: MonsterFilters): boolean {
  return Boolean(filters.query.trim()) || filters.size !== "all";
}

export function filterMonsters(
  monsters: Monster[],
  filters: MonsterFilters
): Monster[] {
  if (!hasActiveMonsterFilters(filters)) {
    return monsters;
  }

  const query = filters.query.trim().toLowerCase();

  return monsters.filter((monster) => {
    if (filters.size !== "all" && monster.size !== filters.size) {
      return false;
    }

    if (query && !monster.nameNormalized.includes(query)) {
      return false;
    }

    return true;
  });
}
