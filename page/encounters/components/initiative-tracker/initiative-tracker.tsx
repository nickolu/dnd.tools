"use client";

import { useMemo } from "react";

import { useMonsters } from "@/lib/query/hooks/useMonsters";
import { selectEncounterById } from "@/lib/store/encounterSelectors";
import { useEncounterLibraryStore } from "@/lib/store/useEncounterLibraryStore";
import {
  combatantToRow,
  partyMemberToRow,
  sortInitiative,
} from "@/page/encounters/utils/initiativeOrder";
import { rollInitiative } from "@/page/encounters/utils/rollInitiative";

import { InitiativeRow } from "./components/initiative-row";
import { InitiativeToolbar } from "./components/initiative-toolbar";
import { RoundCounter } from "./components/round-counter";
import { useDexModByCombatantId } from "./hooks/useDexModByCombatantId";

type Props = {
  encounterId: string;
};

export function InitiativeTracker({ encounterId }: Props) {
  const encounter = useEncounterLibraryStore(selectEncounterById(encounterId));
  const setCombatantInitiative = useEncounterLibraryStore(
    (s) => s.setCombatantInitiative
  );
  const setPartyMemberInitiative = useEncounterLibraryStore(
    (s) => s.setPartyMemberInitiative
  );
  const setPartyMemberInitiativeMod = useEncounterLibraryStore(
    (s) => s.setPartyMemberInitiativeMod
  );
  const rollCombatantInitiatives = useEncounterLibraryStore(
    (s) => s.rollCombatantInitiatives
  );
  const rollPartyMemberInitiatives = useEncounterLibraryStore(
    (s) => s.rollPartyMemberInitiatives
  );
  const adjustHp = useEncounterLibraryStore((s) => s.adjustHp);
  const setHp = useEncounterLibraryStore((s) => s.setHp);
  const toggleCondition = useEncounterLibraryStore((s) => s.toggleCondition);
  const clearConditions = useEncounterLibraryStore((s) => s.clearConditions);
  const nextTurn = useEncounterLibraryStore((s) => s.nextTurn);
  const previousTurn = useEncounterLibraryStore((s) => s.previousTurn);
  const resetInitiative = useEncounterLibraryStore((s) => s.resetInitiative);
  const endEncounter = useEncounterLibraryStore((s) => s.endEncounter);

  const dexModByCombatantId = useDexModByCombatantId(
    encounter?.combatants ?? []
  );

  const { data: monsters = [] } = useMonsters();
  const acByMonsterId = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of monsters) {
      map.set(m.id, m.armorClass);
    }
    return map;
  }, [monsters]);

  const sortedRows = useMemo(() => {
    if (!encounter) return [];
    const partyRows = encounter.partyMembers.map(partyMemberToRow);
    const combatantRows = encounter.combatants.map((c) =>
      combatantToRow(c, dexModByCombatantId.get(c.id) ?? 0)
    );
    return sortInitiative([...partyRows, ...combatantRows]);
  }, [encounter, dexModByCombatantId]);

  if (!encounter) return null;

  const hasRows = sortedRows.length > 0;
  const activeIndex = encounter.initiative.activeIndex;

  function handleRollAll() {
    rollPartyMemberInitiatives(encounterId);
    rollCombatantInitiatives(encounterId, dexModByCombatantId);
  }

  function rollSingleParty(memberId: string) {
    const member = encounter!.partyMembers.find((p) => p.id === memberId);
    if (!member) return;
    setPartyMemberInitiative(
      encounterId,
      memberId,
      rollInitiative(member.initiativeMod)
    );
  }

  function rollSingleCombatant(combatantId: string) {
    const mod = dexModByCombatantId.get(combatantId) ?? 0;
    setCombatantInitiative(encounterId, combatantId, rollInitiative(mod));
  }

  return (
    <section className="surface-card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="typography-h2">Initiative</h2>
        <RoundCounter
          round={encounter.initiative.round}
          onPrev={() => previousTurn(encounterId)}
          onNext={() => nextTurn(encounterId)}
        />
      </div>
      <InitiativeToolbar
        onRollAll={handleRollAll}
        onRollEnemies={() =>
          rollCombatantInitiatives(encounterId, dexModByCombatantId, "enemy")
        }
        onRollAllies={() => {
          rollPartyMemberInitiatives(encounterId);
          rollCombatantInitiatives(encounterId, dexModByCombatantId, "ally");
        }}
        onReset={() => resetInitiative(encounterId)}
        onEnd={() => endEncounter(encounterId)}
      />
      {!hasRows ? (
        <p className="typography-body-sm text-muted">
          Add PCs or monsters to start tracking initiative.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {sortedRows.map((row, idx) => {
            const isActive = idx === activeIndex;
            if (row.kind === "party") {
              return (
                <InitiativeRow
                  key={row.id}
                  row={row}
                  isActive={isActive}
                  editableMod
                  onSetInitiative={(value) =>
                    setPartyMemberInitiative(encounterId, row.id, value)
                  }
                  onSetMod={(mod) =>
                    setPartyMemberInitiativeMod(encounterId, row.id, mod)
                  }
                  onRoll={() => rollSingleParty(row.id)}
                />
              );
            }
            const combatant = encounter.combatants.find((c) => c.id === row.id);
            const ac = combatant
              ? acByMonsterId.get(combatant.monsterId)
              : undefined;
            const hpProps = combatant
              ? {
                  currentHp: combatant.currentHp,
                  maxHp: combatant.maxHp,
                  monsterId: combatant.monsterId,
                  ...(ac !== undefined ? { armorClass: ac } : {}),
                  onAdjustHp: (delta: number) =>
                    adjustHp(encounterId, row.id, delta),
                  onSetHp: (value: number) => setHp(encounterId, row.id, value),
                }
              : {};
            return (
              <InitiativeRow
                key={row.id}
                row={row}
                isActive={isActive}
                {...hpProps}
                onSetInitiative={(value) =>
                  setCombatantInitiative(encounterId, row.id, value)
                }
                onRoll={() => rollSingleCombatant(row.id)}
                conditions={combatant?.conditions ?? []}
                onToggleCondition={(condition) =>
                  toggleCondition(encounterId, row.id, condition)
                }
                onClearConditions={() => clearConditions(encounterId, row.id)}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}
