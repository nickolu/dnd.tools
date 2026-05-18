"use client";

import type { BalanceResult } from "@/lib/domain/encounter/cr2/types";
import { formatPower } from "@/page/encounters/utils/formatPower";
import { getBucketTone } from "@/page/encounters/utils/getBucketTone";

type Props = {
  result: BalanceResult;
  remainingResult?: BalanceResult | null;
  hasParty: boolean;
};

export function BalanceSummary({ result, remainingResult, hasParty }: Props) {
  if (!hasParty) {
    return (
      <section className="surface-card flex flex-col gap-1 p-4">
        <h2 className="typography-h2">Balance</h2>
        <p className="typography-body-sm text-muted">
          Add at least one PC to compute difficulty.
        </p>
      </section>
    );
  }

  const {
    partyPower,
    encounterPower,
    classification,
    tier,
    hasInterpolatedEnemy,
  } = result;
  const tone = getBucketTone(classification.bucket);

  return (
    <section className="surface-card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="typography-h2">Balance</h2>
        <span className="typography-body-sm text-muted">Party tier {tier}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col">
          <span className="typography-kicker text-muted">Party Power</span>
          <span className="typography-h2">{formatPower(partyPower)}</span>
        </div>
        <div className="flex flex-col">
          <span className="typography-kicker text-muted">Encounter Power</span>
          <span className="typography-h2">{formatPower(encounterPower)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="typography-kicker text-muted">Difficulty</span>
        <span className="typography-h1" style={{ color: tone }}>
          {classification.bucket}
        </span>
        {classification.between ? (
          <span className="typography-body-sm text-muted">
            Leaning {classification.between[1]}
          </span>
        ) : null}
      </div>
      {remainingResult && (
        <div className="flex items-center gap-2">
          <span className="typography-kicker text-muted">Remaining</span>
          <span className="typography-body-sm">
            {remainingResult.classification.bucket}
          </span>
          <span className="typography-body-sm text-muted">
            (power: {remainingResult.encounterPower})
          </span>
        </div>
      )}
      {hasInterpolatedEnemy ? (
        <p className="typography-body-sm text-muted">
          Some monster Power values are approximated where the CR is not in the
          official table.
        </p>
      ) : null}
    </section>
  );
}
