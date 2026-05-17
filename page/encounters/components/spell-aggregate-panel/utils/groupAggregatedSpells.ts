import type { AggregatedSpell } from "@/page/encounters/utils/aggregateSpells";

export type SpellGroup = {
  key: string;
  label: string;
  spells: AggregatedSpell[];
};

const LEVEL_LABEL: Record<number, string> = {
  0: "Cantrips",
  1: "Level 1",
  2: "Level 2",
  3: "Level 3",
  4: "Level 4",
  5: "Level 5",
  6: "Level 6",
  7: "Level 7",
  8: "Level 8",
  9: "Level 9",
};

export function groupByLevel(spells: AggregatedSpell[]): SpellGroup[] {
  const buckets = new Map<number, AggregatedSpell[]>();
  for (const entry of spells) {
    const list = buckets.get(entry.spell.level) ?? [];
    list.push(entry);
    buckets.set(entry.spell.level, list);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, items]) => ({
      key: `level-${level}`,
      label: LEVEL_LABEL[level] ?? `Level ${level}`,
      spells: items,
    }));
}

export function groupBySchool(spells: AggregatedSpell[]): SpellGroup[] {
  const buckets = new Map<string, AggregatedSpell[]>();
  for (const entry of spells) {
    const list = buckets.get(entry.spell.school) ?? [];
    list.push(entry);
    buckets.set(entry.spell.school, list);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([school, items]) => ({
      key: `school-${school}`,
      label: school[0]!.toUpperCase() + school.slice(1),
      spells: items,
    }));
}
