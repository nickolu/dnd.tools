"use client";

import { useMemo, useState } from "react";

import { useMonsters } from "@/lib/query/hooks/useMonsters";
import { selectEncounterById } from "@/lib/store/encounterSelectors";
import { useEncounterLibraryStore } from "@/lib/store/useEncounterLibraryStore";
import { useEncounterBalance } from "@/page/encounters/hooks/useEncounterBalance";
import { buildTipsRequest } from "@/page/encounters/utils/buildTipsRequest";

import { TipsSection } from "./components/tips-section";
import { TipsSkeleton } from "./components/tips-skeleton";

const COST_GUARD_THRESHOLD = 12;

type Props = {
  encounterId: string;
};

function formatRelativeTime(ts: number | null): string | null {
  if (ts === null) return null;
  const deltaMs = Date.now() - ts;
  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function EncounterTipsPanel({ encounterId }: Props) {
  const encounter = useEncounterLibraryStore(selectEncounterById(encounterId));
  const generateTips = useEncounterLibraryStore((s) => s.generateTips);
  const clearTips = useEncounterLibraryStore((s) => s.clearTips);
  const ephemeral = useEncounterLibraryStore(
    (s) => s.tipsEphemeral[encounterId]
  );
  const { data: monsters = [] } = useMonsters();

  const { balance } = useEncounterBalance(
    encounter ?? {
      id: "",
      name: "",
      ruleset: "advanced",
      partyMembers: [],
      combatants: [],
      initiative: { round: 1, activeIndex: null },
      tips: null,
      tipsGeneratedAt: null,
      createdAt: 0,
      updatedAt: 0,
    }
  );

  const monstersById = useMemo(
    () => new Map(monsters.map((m) => [m.id, m])),
    [monsters]
  );

  const [confirmingLarge, setConfirmingLarge] = useState(false);
  const [context, setContext] = useState("");

  if (!encounter) return null;
  const loading = ephemeral?.loading ?? false;
  const error = ephemeral?.error ?? null;
  const tips = encounter.tips;
  const combatantCount = encounter.combatants.length;
  const isLarge = combatantCount > COST_GUARD_THRESHOLD;

  async function handleGenerate() {
    if (!encounter || encounter.partyMembers.length === 0) return;
    if (encounter.combatants.length === 0) return;
    setConfirmingLarge(false);
    const request = buildTipsRequest(
      encounter,
      monstersById,
      balance.classification.bucket,
      context.trim() || undefined
    );
    await generateTips(encounterId, request);
  }

  function handleGenerateClick() {
    if (isLarge && !confirmingLarge) {
      setConfirmingLarge(true);
      return;
    }
    void handleGenerate();
  }

  const canGenerate =
    encounter.partyMembers.length > 0 && encounter.combatants.length > 0;

  return (
    <section className="surface-card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="typography-h2">DM tips</h2>
        {encounter.tipsGeneratedAt ? (
          <span className="typography-body-sm text-muted">
            Generated {formatRelativeTime(encounter.tipsGeneratedAt)}
          </span>
        ) : null}
      </div>

      {!canGenerate ? (
        <p className="typography-body-sm text-muted">
          Add at least one PC and one monster to generate tips.
        </p>
      ) : loading ? (
        <TipsSkeleton />
      ) : error ? (
        <div className="flex flex-col gap-2">
          <p className="typography-body-sm text-secondary">{error}</p>
          <button
            type="button"
            className="admin-button typography-body-sm w-fit px-3 py-1"
            onClick={() => void handleGenerate()}
          >
            Retry
          </button>
        </div>
      ) : tips ? (
        <div className="flex flex-col gap-3">
          <TipsSection title="Terrain ideas" items={tips.terrainIdeas} />
          <TipsSection
            title="Environmental hazards"
            items={tips.environmentalHazards}
          />
          <TipsSection
            title="Mechanic suggestions"
            items={tips.mechanicSuggestions}
          />
          <TipsSection title="Tactical notes" paragraph={tips.tacticalNotes} />
          <TipsSection title="Puzzles" items={tips.puzzles} />
          <TipsSection
            title="Roleplaying hooks"
            items={tips.roleplayingHooks}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="admin-button-secondary typography-body-sm px-3 py-1"
              onClick={() => void handleGenerate()}
            >
              Regenerate
            </button>
            <button
              type="button"
              className="admin-button-secondary typography-body-sm px-3 py-1"
              onClick={() => clearTips(encounterId)}
            >
              Clear
            </button>
          </div>
        </div>
      ) : confirmingLarge ? (
        <div className="flex flex-col gap-2">
          <p className="typography-body-sm text-secondary">
            This encounter has {combatantCount} combatants. Generating tips will
            be slower and consumes more API tokens. Continue?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="admin-button typography-body-sm px-3 py-1"
              onClick={() => void handleGenerate()}
            >
              Generate
            </button>
            <button
              type="button"
              className="admin-button-secondary typography-body-sm px-3 py-1"
              onClick={() => setConfirmingLarge(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="typography-body-sm text-muted">
            Get terrain ideas, hazards, mechanics, and tactical notes tuned to
            this encounter&apos;s monsters.
          </p>
          <textarea
            className="input-field typography-body-sm w-full px-2 py-1"
            placeholder="Optional: describe the scenario (e.g., 'haunted forest ambush', 'boss fight in a throne room')"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            maxLength={500}
            rows={2}
          />
          <button
            type="button"
            className="admin-button typography-body-sm w-fit px-3 py-1"
            onClick={handleGenerateClick}
          >
            Generate tips
          </button>
        </div>
      )}
    </section>
  );
}
