"use client";

import type { AggregatedSpell } from "@/page/encounters/utils/aggregateSpells";
import {
  formatSpellComponents,
  formatSpellLevelAndSchool,
} from "@/page/spells/components/spell-card/utils/formatSpell";

type Props = {
  entry: AggregatedSpell;
};

function summarizeCasters(entry: AggregatedSpell): string {
  return entry.casters
    .map((c) =>
      c.instanceCount > 1
        ? `${c.monsterName} (×${c.instanceCount})`
        : c.monsterName
    )
    .join(", ");
}

function firstParagraph(description: string[], maxLength = 140): string {
  const first = description[0] ?? "";
  if (first.length <= maxLength) return first;
  return `${first.slice(0, maxLength).trimEnd()}…`;
}

export function SpellSummaryRow({ entry }: Props) {
  const { spell } = entry;
  return (
    <li
      className="flex flex-col gap-1 rounded-md border p-2"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="typography-body">{spell.name}</span>
        <span className="typography-body-sm text-muted">
          {formatSpellLevelAndSchool(spell)}
        </span>
      </div>
      <div className="typography-body-sm text-muted flex flex-wrap gap-3">
        <span>{spell.castingTime}</span>
        <span>{spell.range}</span>
        <span>{formatSpellComponents(spell)}</span>
        {spell.concentration ? <span>Concentration</span> : null}
        {spell.ritual ? <span>Ritual</span> : null}
      </div>
      <p className="typography-body-sm text-secondary">
        {firstParagraph(spell.description)}
      </p>
      <p className="typography-body-sm text-muted">
        Cast by: {summarizeCasters(entry)}
      </p>
    </li>
  );
}
