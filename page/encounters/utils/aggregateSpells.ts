import type { Monster } from "@/lib/domain/monster.schema";
import type { Spell } from "@/lib/domain/spell.schema";

type CombatantRef = {
  monsterId: string;
  monsterName: string;
};

export type AggregatedSpellCaster = {
  monsterId: string;
  monsterName: string;
  instanceCount: number;
};

export type AggregatedSpell = {
  spell: Spell;
  casters: AggregatedSpellCaster[];
};

export type AggregateSpellsResult = {
  spells: AggregatedSpell[];
  unresolved: string[];
};

function normalizeSpellName(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Given the combatants in an encounter plus lookup maps for monsters and
 * spells, returns the deduped set of spells cast by any monster in the
 * encounter along with which monster instances cast each spell.
 *
 * Names that don't resolve to a known spell are collected in `unresolved`
 * so the UI can surface them as a diagnostic rather than silently dropping.
 */
export function aggregateSpells(
  combatants: CombatantRef[],
  monstersById: Map<string, Monster>,
  spellsByNormalizedName: Map<string, Spell>
): AggregateSpellsResult {
  const monsterInstanceCounts = new Map<string, number>();
  const monsterNamesById = new Map<string, string>();
  for (const c of combatants) {
    monsterInstanceCounts.set(
      c.monsterId,
      (monsterInstanceCounts.get(c.monsterId) ?? 0) + 1
    );
    if (!monsterNamesById.has(c.monsterId)) {
      monsterNamesById.set(c.monsterId, c.monsterName);
    }
  }

  const spellEntries = new Map<
    string,
    { spell: Spell; casters: Map<string, AggregatedSpellCaster> }
  >();
  const unresolvedSet = new Set<string>();

  for (const [monsterId, instanceCount] of monsterInstanceCounts.entries()) {
    const monster = monstersById.get(monsterId);
    if (!monster?.spellList) continue;

    for (const rawName of monster.spellList) {
      const normalized = normalizeSpellName(rawName);
      const spell = spellsByNormalizedName.get(normalized);
      if (!spell) {
        unresolvedSet.add(rawName);
        continue;
      }
      let entry = spellEntries.get(spell.id);
      if (!entry) {
        entry = { spell, casters: new Map() };
        spellEntries.set(spell.id, entry);
      }
      entry.casters.set(monsterId, {
        monsterId,
        monsterName: monsterNamesById.get(monsterId) ?? monster.name,
        instanceCount,
      });
    }
  }

  const result: AggregatedSpell[] = [...spellEntries.values()].map(
    ({ spell, casters }) => ({
      spell,
      casters: [...casters.values()],
    })
  );

  result.sort((a, b) => {
    if (a.spell.level !== b.spell.level) return a.spell.level - b.spell.level;
    return a.spell.name.localeCompare(b.spell.name);
  });

  return {
    spells: result,
    unresolved: [...unresolvedSet],
  };
}
