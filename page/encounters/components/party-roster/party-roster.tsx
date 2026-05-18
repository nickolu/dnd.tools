"use client";

import type {
  Combatant,
  PartyMember,
} from "@/lib/domain/encounter/encounter.schema";
import { useEncounterLibraryStore } from "@/lib/store/useEncounterLibraryStore";

import { AddPcForm } from "./components/add-pc-form";

type Props = {
  encounterId: string;
  partyMembers: PartyMember[];
  allies: Combatant[];
};

export function PartyRoster({ encounterId, partyMembers, allies }: Props) {
  const addPC = useEncounterLibraryStore((s) => s.addPC);
  const removePartyMember = useEncounterLibraryStore(
    (s) => s.removePartyMember
  );
  const updatePartyMember = useEncounterLibraryStore(
    (s) => s.updatePartyMember
  );
  const setSavedParty = useEncounterLibraryStore((s) => s.setSavedParty);
  const savedParty = useEncounterLibraryStore((s) => s.savedParty);

  return (
    <section className="surface-card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="typography-h2 flex-1">Party</h2>
        {partyMembers.length > 0 && (
          <button
            type="button"
            className="admin-button-secondary typography-body-sm px-2 py-1"
            onClick={() => {
              setSavedParty(
                partyMembers.map((p) => ({ name: p.name, level: p.level }))
              );
            }}
          >
            Save as default
          </button>
        )}
        {savedParty.length > 0 && partyMembers.length === 0 && (
          <button
            type="button"
            className="admin-button-secondary typography-body-sm px-2 py-1"
            onClick={() => {
              for (const p of savedParty) {
                addPC(encounterId, { name: p.name, level: p.level });
              }
            }}
          >
            Load default party ({savedParty.length})
          </button>
        )}
      </div>
      <AddPcForm onAdd={(name, level) => addPC(encounterId, { name, level })} />
      {partyMembers.length === 0 ? (
        <p className="typography-body-sm text-muted">
          No PCs yet. Add one to compute difficulty.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {partyMembers.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2">
              <input
                className="input-field typography-body-sm min-w-0 flex-1 px-2 py-1"
                value={p.name}
                onChange={(e) =>
                  updatePartyMember(encounterId, p.id, { name: e.target.value })
                }
                aria-label={`Name for ${p.name}`}
              />
              <select
                className="input-field typography-body-sm px-2 py-1"
                value={p.level}
                onChange={(e) =>
                  updatePartyMember(encounterId, p.id, {
                    level: Number.parseInt(e.target.value, 10),
                  })
                }
                aria-label={`Level for ${p.name}`}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    Lvl {n}
                  </option>
                ))}
              </select>
              <input
                type="number"
                inputMode="numeric"
                className="input-field typography-body-sm w-20 px-2 py-1"
                value={p.maxHp ?? ""}
                min={1}
                placeholder="Max HP"
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    updatePartyMember(encounterId, p.id, {
                      maxHp: undefined,
                    });
                  } else {
                    const parsed = Number.parseInt(raw, 10);
                    if (Number.isFinite(parsed) && parsed > 0) {
                      updatePartyMember(encounterId, p.id, { maxHp: parsed });
                    }
                  }
                }}
                aria-label={`Max HP for ${p.name}`}
              />
              <input
                type="number"
                inputMode="numeric"
                className="input-field typography-body-sm w-14 px-2 py-1"
                value={p.armorClass ?? ""}
                min={1}
                placeholder="AC"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    updatePartyMember(encounterId, p.id, {
                      armorClass: undefined,
                    });
                    return;
                  }
                  const parsed = Number.parseInt(v, 10);
                  if (Number.isFinite(parsed) && parsed > 0) {
                    updatePartyMember(encounterId, p.id, {
                      armorClass: parsed,
                    });
                  }
                }}
                aria-label={`AC for ${p.name}`}
              />
              <input
                type="number"
                inputMode="numeric"
                className="input-field typography-body-sm w-14 px-2 py-1"
                value={p.speed ?? ""}
                min={0}
                placeholder="Spd"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    updatePartyMember(encounterId, p.id, {
                      speed: undefined,
                    });
                    return;
                  }
                  const parsed = Number.parseInt(v, 10);
                  if (Number.isFinite(parsed) && parsed >= 0) {
                    updatePartyMember(encounterId, p.id, { speed: parsed });
                  }
                }}
                aria-label={`Speed for ${p.name}`}
              />
              <input
                type="number"
                inputMode="numeric"
                className="input-field typography-body-sm w-14 px-2 py-1"
                value={p.passivePerception ?? ""}
                min={1}
                placeholder="PP"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    updatePartyMember(encounterId, p.id, {
                      passivePerception: undefined,
                    });
                    return;
                  }
                  const parsed = Number.parseInt(v, 10);
                  if (Number.isFinite(parsed) && parsed > 0) {
                    updatePartyMember(encounterId, p.id, {
                      passivePerception: parsed,
                    });
                  }
                }}
                aria-label={`Passive Perception for ${p.name}`}
              />
              <button
                type="button"
                className="admin-button-secondary typography-body-sm px-2 py-1"
                onClick={() => removePartyMember(encounterId, p.id)}
                aria-label={`Remove ${p.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {allies.length > 0 ? (
        <div
          className="flex flex-col gap-1.5 border-t pt-3"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <span className="typography-kicker text-muted">
            Allies ({allies.length})
          </span>
          <ul className="flex flex-wrap gap-1.5">
            {allies.map((a) => (
              <li key={a.id} className="filter-chip">
                {a.nameOverride ?? a.monsterName}
              </li>
            ))}
          </ul>
          <p className="typography-body-sm text-muted">
            Allies are added via the Monsters panel and contribute to Party
            Power.
          </p>
        </div>
      ) : null}
    </section>
  );
}
