"use client";

import type { Combatant } from "@/lib/domain/encounter/encounter.schema";
import type { CombatantGroup } from "@/page/encounters/types";

type Props = {
  combatants: Combatant[];
};

function groupByMonster(combatants: Combatant[]): CombatantGroup[] {
  const groups = new Map<string, CombatantGroup>();
  for (const c of combatants) {
    const key = `${c.monsterId}:${c.side}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        monsterId: c.monsterId,
        monsterName: c.monsterName,
        side: c.side,
        combatants: [],
      };
      groups.set(key, group);
    }
    group.combatants.push(c);
  }
  return [...groups.values()];
}

export function CombatantList({ combatants }: Props) {
  const enemies = combatants.filter((c) => c.side === "enemy");
  const allies = combatants.filter((c) => c.side === "ally");

  return (
    <section className="flex flex-col gap-3">
      <SideSection
        title="Enemies"
        groups={groupByMonster(enemies)}
        emptyHint="No enemies yet — add monsters as enemies."
      />
      <SideSection
        title="Allies"
        groups={groupByMonster(allies)}
        emptyHint="No allies yet."
      />
    </section>
  );
}

function SideSection({
  title,
  groups,
  emptyHint,
}: {
  title: string;
  groups: CombatantGroup[];
  emptyHint: string;
}) {
  const count = groups.reduce((s, g) => s + g.combatants.length, 0);
  return (
    <div className="surface-card flex flex-col gap-2 p-4">
      <h3 className="typography-h3 flex items-center gap-2">
        <span>{title}</span>
        <span className="typography-body-sm text-muted">({count})</span>
      </h3>
      {groups.length === 0 ? (
        <p className="typography-body-sm text-muted">{emptyHint}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {groups.map((g) => (
            <li key={`${g.monsterId}:${g.side}`}>
              <a
                href={`/monsters/${g.monsterId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="typography-kicker text-muted hover:underline"
              >
                {g.monsterName} ×{g.combatants.length}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
