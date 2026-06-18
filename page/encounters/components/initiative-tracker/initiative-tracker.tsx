"use client";

import { useEffect, useMemo, useState } from "react";

import { useMonsters } from "@/lib/query/hooks/useMonsters";
import { selectEncounterById } from "@/lib/store/encounterSelectors";
import { useEncounterLibraryStore } from "@/lib/store/useEncounterLibraryStore";
import { formatInitiativeOrder } from "@/page/encounters/utils/formatInitiativeOrder";
import { buildInitiativeSlots } from "@/page/encounters/utils/initiativeOrder";
import { rollInitiative } from "@/page/encounters/utils/rollInitiative";

import { useMapPlacementStore } from "../encounter-map/stores/useMapPlacementStore";
import { CondensedInitiativeRow } from "./components/condensed-initiative-row";
import { GroupedInitiativeRow } from "./components/grouped-initiative-row";
import { InitiativeRow } from "./components/initiative-row";
import { InitiativeToolbar } from "./components/initiative-toolbar";
import { RoundCounter } from "./components/round-counter";
import { useDexModByCombatantId } from "./hooks/useDexModByCombatantId";
import { useRollAnimation } from "./hooks/useRollAnimation";

type Props = {
  encounterId: string;
};

export function InitiativeTracker({ encounterId }: Props) {
  const [condensed, setCondensed] = useState(false);
  const [copied, setCopied] = useState(false);
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
  const setDeathSave = useEncounterLibraryStore((s) => s.setDeathSave);
  const toggleCondition = useEncounterLibraryStore((s) => s.toggleCondition);
  const clearConditions = useEncounterLibraryStore((s) => s.clearConditions);
  const removeToken = useEncounterLibraryStore((s) => s.removeToken);
  const duplicateCombatant = useEncounterLibraryStore(
    (s) => s.duplicateCombatant
  );
  const addCombatantToGroup = useEncounterLibraryStore(
    (s) => s.addCombatantToGroup
  );
  const toggleConcentration = useEncounterLibraryStore(
    (s) => s.toggleConcentration
  );
  const nextTurn = useEncounterLibraryStore((s) => s.nextTurn);
  const previousTurn = useEncounterLibraryStore((s) => s.previousTurn);
  const resetInitiative = useEncounterLibraryStore((s) => s.resetInitiative);
  const endEncounter = useEncounterLibraryStore((s) => s.endEncounter);

  const pendingPlace = useMapPlacementStore((s) => s.pendingPlace);
  const setPendingPlace = useMapPlacementStore((s) => s.setPendingPlace);

  const dexModByCombatantId = useDexModByCombatantId(
    encounter?.combatants ?? []
  );

  const { animateRoll, isRolling, displayValue } = useRollAnimation();

  const { data: monsters = [] } = useMonsters();
  const acByMonsterId = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of monsters) {
      map.set(m.id, m.armorClass);
    }
    return map;
  }, [monsters]);

  const monsterById = useMemo(
    () => new Map(monsters.map((m) => [m.id, m])),
    [monsters]
  );

  const sortedSlots = useMemo(() => {
    if (!encounter) return [];
    return buildInitiativeSlots(
      encounter.combatants,
      encounter.partyMembers,
      dexModByCombatantId
    );
  }, [encounter, dexModByCombatantId]);

  // Keyboard shortcuts for turn navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip when focused on an input, textarea, or select
      const target = e.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      }

      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextTurn(encounterId);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        previousTurn(encounterId);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [encounterId, nextTurn, previousTurn]);

  if (!encounter) return null;

  const hasRows = sortedSlots.length > 0;
  const activeIndex = encounter.initiative.activeIndex;

  function handleRollAll() {
    // For animation key purposes, collect all IDs (party + combatants)
    const allPartyIds = encounter!.partyMembers.map((p) => p.id);
    // For groups, use the first combatant's ID for animation display
    const allCombatantAnimIds: string[] = [];
    const seenGroups = new Set<string>();
    for (const slot of sortedSlots) {
      if (slot.kind === "group") {
        if (!seenGroups.has(slot.groupId)) {
          seenGroups.add(slot.groupId);
          if (slot.combatants[0])
            allCombatantAnimIds.push(slot.combatants[0].id);
        }
      } else if (slot.kind === "combatant") {
        allCombatantAnimIds.push(slot.id);
      }
    }
    animateRoll([...allPartyIds, ...allCombatantAnimIds]);
    rollPartyMemberInitiatives(encounterId);
    rollCombatantInitiatives(encounterId, dexModByCombatantId);
  }

  function rollSingleParty(memberId: string) {
    const member = encounter!.partyMembers.find((p) => p.id === memberId);
    if (!member) return;
    animateRoll([memberId]);
    setPartyMemberInitiative(
      encounterId,
      memberId,
      rollInitiative(member.initiativeMod)
    );
  }

  function rollSingleCombatant(combatantId: string) {
    const mod = dexModByCombatantId.get(combatantId) ?? 0;
    animateRoll([combatantId]);
    setCombatantInitiative(encounterId, combatantId, rollInitiative(mod));
  }

  function handleCopyInitiative() {
    if (!encounter) return;
    const text = formatInitiativeOrder(
      sortedSlots,
      encounter.initiative.round,
      encounter.partyMembers,
      encounter.combatants
    );
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // Silently fail if clipboard API is not available
      });
  }

  function rollSingleGroup(_groupId: string, anyMemberId: string) {
    const mod = dexModByCombatantId.get(anyMemberId) ?? 0;
    animateRoll([anyMemberId]);
    // setCombatantInitiative fans out to all group members
    setCombatantInitiative(encounterId, anyMemberId, rollInitiative(mod));
  }

  return (
    <section className="surface-card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="typography-h2">Initiative</h2>
        <div className="flex items-center gap-2">
          <RoundCounter
            round={encounter.initiative.round}
            onPrev={() => previousTurn(encounterId)}
            onNext={() => nextTurn(encounterId)}
          />
          <div className="flex gap-1">
            <button
              type="button"
              className="filter-chip"
              data-active={!condensed}
              onClick={() => setCondensed(false)}
            >
              Full
            </button>
            <button
              type="button"
              className="filter-chip"
              data-active={condensed}
              onClick={() => setCondensed(true)}
            >
              Compact
            </button>
          </div>
        </div>
      </div>
      {!condensed && (
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
          onCopy={handleCopyInitiative}
          copied={copied}
        />
      )}
      {!hasRows ? (
        <p className="typography-body-sm text-muted">
          Add PCs or monsters to start tracking initiative.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {sortedSlots.map((slot, idx) => {
            const isActive = idx === activeIndex;

            if (slot.kind === "group") {
              // Build conditions map for the group's combatants
              const conditionsMap: Record<
                string,
                (typeof slot.combatants)[0]["conditions"]
              > = {};
              for (const c of slot.combatants) {
                conditionsMap[c.id] = c.conditions;
              }
              const onMapIds = new Set(
                slot.combatants
                  .filter((c) => c.position !== undefined)
                  .map((c) => c.id)
              );
              const pendingCombatantId =
                pendingPlace?.kind === "combatant" &&
                slot.combatants.some((c) => c.id === pendingPlace.id)
                  ? pendingPlace.id
                  : null;
              const anyMemberId = slot.combatants[0]?.id ?? "";

              if (condensed) {
                // Condensed group: show name x count, aggregate HP bar, initiative
                const totalMaxHp = slot.combatants.reduce(
                  (s, c) => s + c.maxHp,
                  0
                );
                const totalCurrentHp = slot.combatants.reduce(
                  (s, c) => s + c.currentHp,
                  0
                );
                const hpPercent =
                  totalMaxHp > 0
                    ? Math.max(
                        0,
                        Math.min(100, (totalCurrentHp / totalMaxHp) * 100)
                      )
                    : 0;
                let hpColor: string;
                if (totalCurrentHp <= 0) {
                  hpColor = "var(--color-text-muted)";
                } else if (hpPercent <= 25) {
                  hpColor = "var(--color-danger)";
                } else if (hpPercent <= 50) {
                  hpColor = "var(--color-accent)";
                } else {
                  hpColor = "#4a9e6b";
                }
                return (
                  <li
                    key={slot.groupId}
                    className="relative flex items-center gap-2 rounded-md border px-2 py-1"
                    style={{
                      borderColor: isActive
                        ? "var(--color-accent)"
                        : "var(--color-border-subtle)",
                    }}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        display: "inline-block",
                        width: "0.2rem",
                        height: "1rem",
                        background: isActive
                          ? "var(--color-accent)"
                          : "var(--color-border-strong)",
                        borderRadius: "999px",
                        flexShrink: 0,
                      }}
                    />
                    <span className="typography-body-sm flex-1 truncate">
                      {slot.name} &times; {slot.combatants.length}
                    </span>
                    <div
                      style={{
                        width: "3rem",
                        height: "0.5rem",
                        background: "var(--color-border-subtle)",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                      title={`HP: ${totalCurrentHp} / ${totalMaxHp}`}
                    >
                      <div
                        style={{
                          width: `${hpPercent}%`,
                          height: "100%",
                          background: hpColor,
                          borderRadius: "999px",
                          transition: "width 0.2s ease, background 0.2s ease",
                        }}
                      />
                    </div>
                    <span
                      className="typography-body-sm text-muted"
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        minWidth: "1.5rem",
                        textAlign: "right",
                      }}
                    >
                      {slot.initiative ?? "\u2014"}
                    </span>
                  </li>
                );
              }

              return (
                <GroupedInitiativeRow
                  key={slot.groupId}
                  group={slot}
                  encounterId={encounterId}
                  isActive={isActive}
                  onSetInitiative={(value) =>
                    anyMemberId
                      ? setCombatantInitiative(encounterId, anyMemberId, value)
                      : undefined
                  }
                  onRoll={() => rollSingleGroup(slot.groupId, anyMemberId)}
                  onAddToGroup={() =>
                    addCombatantToGroup(encounterId, slot.groupId)
                  }
                  onAdjustHp={(combatantId, delta) =>
                    adjustHp(encounterId, combatantId, delta)
                  }
                  onSetHp={(combatantId, value) =>
                    setHp(encounterId, combatantId, value)
                  }
                  {...(isRolling(anyMemberId)
                    ? { rollingDisplay: displayValue(anyMemberId) }
                    : {})}
                  hasMap={!!encounter.map}
                  onMapCombatantIds={onMapIds}
                  pendingPlaceCombatantId={pendingCombatantId}
                  onPlaceOnMap={(combatantId) =>
                    setPendingPlace(
                      pendingPlace?.kind === "combatant" &&
                        pendingPlace.id === combatantId
                        ? null
                        : { kind: "combatant", id: combatantId }
                    )
                  }
                  onRemoveFromMap={(combatantId) =>
                    removeToken(encounterId, "combatant", combatantId)
                  }
                  conditions={conditionsMap}
                  onToggleCondition={(combatantId, condition) =>
                    toggleCondition(encounterId, combatantId, condition)
                  }
                  onClearConditions={(combatantId) =>
                    clearConditions(encounterId, combatantId)
                  }
                  onToggleGroupCondition={(condition) => {
                    const allHave = slot.combatants.every((c) =>
                      (c.conditions ?? []).includes(condition)
                    );
                    for (const c of slot.combatants) {
                      const hasIt = (c.conditions ?? []).includes(condition);
                      if (allHave && hasIt) {
                        toggleCondition(encounterId, c.id, condition);
                      } else if (!allHave && !hasIt) {
                        toggleCondition(encounterId, c.id, condition);
                      }
                    }
                  }}
                  onClearGroupConditions={() => {
                    for (const c of slot.combatants) {
                      clearConditions(encounterId, c.id);
                    }
                  }}
                />
              );
            }

            if (slot.kind === "party") {
              const pc = encounter.partyMembers.find((p) => p.id === slot.id);
              const pcOnMap = pc?.position !== undefined;
              const pcHpProps =
                pc?.maxHp !== undefined && pc?.currentHp !== undefined
                  ? {
                      currentHp: pc.currentHp,
                      maxHp: pc.maxHp,
                      onAdjustHp: (delta: number) =>
                        adjustHp(encounterId, slot.id, delta),
                      onSetHp: (value: number) =>
                        setHp(encounterId, slot.id, value),
                    }
                  : {};
              if (condensed) {
                return (
                  <CondensedInitiativeRow
                    key={slot.id}
                    row={slot}
                    isActive={isActive}
                    {...pcHpProps}
                  />
                );
              }
              return (
                <InitiativeRow
                  key={slot.id}
                  row={slot}
                  isActive={isActive}
                  editableMod
                  {...pcHpProps}
                  {...(pc?.armorClass !== undefined
                    ? { armorClass: String(pc.armorClass) }
                    : {})}
                  isOnMap={pcOnMap}
                  {...(pcOnMap
                    ? {
                        onRemoveFromMap: () =>
                          removeToken(encounterId, "pc", slot.id),
                      }
                    : {})}
                  isPendingPlacement={
                    pendingPlace?.kind === "pc" && pendingPlace.id === slot.id
                  }
                  {...(encounter.map && !pcOnMap
                    ? {
                        onPlaceOnMap: () =>
                          setPendingPlace(
                            pendingPlace?.kind === "pc" &&
                              pendingPlace.id === slot.id
                              ? null
                              : { kind: "pc", id: slot.id }
                          ),
                      }
                    : {})}
                  onSetInitiative={(value) =>
                    setPartyMemberInitiative(encounterId, slot.id, value)
                  }
                  onSetMod={(mod) =>
                    setPartyMemberInitiativeMod(encounterId, slot.id, mod)
                  }
                  onRoll={() => rollSingleParty(slot.id)}
                  {...(isRolling(slot.id)
                    ? { rollingDisplay: displayValue(slot.id) }
                    : {})}
                  conditions={pc?.conditions ?? []}
                  onToggleCondition={(condition) =>
                    toggleCondition(encounterId, slot.id, condition)
                  }
                  onClearConditions={() =>
                    clearConditions(encounterId, slot.id)
                  }
                  {...(pc?.currentHp === 0 && pc?.maxHp !== undefined
                    ? {
                        deathSaves: pc.deathSaves ?? {
                          successes: 0,
                          failures: 0,
                        },
                        onSetDeathSave: (
                          type: "success" | "failure",
                          count: number
                        ) => setDeathSave(encounterId, slot.id, type, count),
                      }
                    : {})}
                />
              );
            }

            // slot.kind === "combatant" (ungrouped)
            const combatant = encounter.combatants.find(
              (c) => c.id === slot.id
            );
            const ac = combatant
              ? acByMonsterId.get(combatant.monsterId)
              : undefined;
            const monsterForRow = combatant
              ? monsterById.get(combatant.monsterId)
              : undefined;
            const combatantOnMap = combatant?.position !== undefined;
            const hpProps = combatant
              ? {
                  currentHp: combatant.currentHp,
                  maxHp: combatant.maxHp,
                  monsterId: combatant.monsterId,
                  ...(ac !== undefined ? { armorClass: ac } : {}),
                  ...(monsterForRow !== undefined
                    ? { monster: monsterForRow }
                    : {}),
                  onAdjustHp: (delta: number) =>
                    adjustHp(encounterId, slot.id, delta),
                  onSetHp: (value: number) =>
                    setHp(encounterId, slot.id, value),
                }
              : {};
            if (condensed) {
              const condensedHpProps =
                combatant !== undefined
                  ? {
                      currentHp: combatant.currentHp,
                      maxHp: combatant.maxHp,
                      onAdjustHp: (delta: number) =>
                        adjustHp(encounterId, slot.id, delta),
                      onSetHp: (value: number) =>
                        setHp(encounterId, slot.id, value),
                    }
                  : {};
              return (
                <CondensedInitiativeRow
                  key={slot.id}
                  row={slot}
                  isActive={isActive}
                  {...condensedHpProps}
                />
              );
            }
            return (
              <InitiativeRow
                key={slot.id}
                row={slot}
                isActive={isActive}
                {...hpProps}
                isOnMap={combatantOnMap}
                {...(combatantOnMap
                  ? {
                      onRemoveFromMap: () =>
                        removeToken(encounterId, "combatant", slot.id),
                    }
                  : {})}
                isPendingPlacement={
                  pendingPlace?.kind === "combatant" &&
                  pendingPlace.id === slot.id
                }
                {...(encounter.map && !combatantOnMap
                  ? {
                      onPlaceOnMap: () =>
                        setPendingPlace(
                          pendingPlace?.kind === "combatant" &&
                            pendingPlace.id === slot.id
                            ? null
                            : { kind: "combatant", id: slot.id }
                        ),
                    }
                  : {})}
                onSetInitiative={(value) =>
                  setCombatantInitiative(encounterId, slot.id, value)
                }
                onRoll={() => rollSingleCombatant(slot.id)}
                {...(isRolling(slot.id)
                  ? { rollingDisplay: displayValue(slot.id) }
                  : {})}
                onDuplicate={() => duplicateCombatant(encounterId, slot.id)}
                conditions={combatant?.conditions ?? []}
                onToggleCondition={(condition) =>
                  toggleCondition(encounterId, slot.id, condition)
                }
                onClearConditions={() => clearConditions(encounterId, slot.id)}
                {...(combatant?.concentrating ? { concentrating: true } : {})}
                onToggleConcentration={() =>
                  toggleConcentration(encounterId, slot.id)
                }
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}
