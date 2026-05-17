"use client";

import type { Combatant } from "@/lib/domain/encounter/encounter.schema";
import type { CombatantGroup } from "@/page/encounters/types";

import { CombatantRow } from "./components/combatant-row";

type Props = {
  encounterId: string;
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

function autoSuffix(index: number, total: number): string {
  if (total <= 1) return "";
  if (index < 26) return ` ${String.fromCharCode(65 + index)}`;
  return ` #${index + 1}`;
}

export function CombatantList({ encounterId, combatants }: Props) {
  const enemies = combatants.filter((c) => c.side === "enemy");
  const allies = combatants.filter((c) => c.side === "ally");

  return (
    <section className="flex flex-col gap-3">
      <SideSection
        title="Enemies"
        groups={groupByMonster(enemies)}
        encounterId={encounterId}
        emptyHint="No enemies yet — add monsters as enemies."
      />
      <SideSection
        title="Allies"
        groups={groupByMonster(allies)}
        encounterId={encounterId}
        emptyHint="No allies yet."
      />
    </section>
  );
}

function SideSection({
  title,
  groups,
  encounterId,
  emptyHint,
}: {
  title: string;
  groups: CombatantGroup[];
  encounterId: string;
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
            <li
              key={`${g.monsterId}:${g.side}`}
              className="flex flex-col gap-1.5"
            >
              <span className="typography-kicker text-muted">
                {g.monsterName} ×{g.combatants.length}
              </span>
              <ul className="flex flex-col gap-1.5">
                {g.combatants.map((c, idx) => (
                  <CombatantRow
                    key={c.id}
                    encounterId={encounterId}
                    combatant={c}
                    displayName={
                      c.nameOverride ??
                      `${c.monsterName}${autoSuffix(idx, g.combatants.length)}`
                    }
                  />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
