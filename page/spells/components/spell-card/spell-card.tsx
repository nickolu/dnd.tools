import { SpellTextBlock } from "@/page/spells/components/spell-card/components/spell-text-block";
import type { SpellCardProps } from "@/page/spells/components/spell-card/types";
import {
  formatSpellComponents,
  formatSpellLevelAndSchool,
} from "@/page/spells/components/spell-card/utils/formatSpell";

export function SpellCard({ spell }: SpellCardProps) {
  return (
    <article className="surface-card p-5">
      <header className="mb-4 border-b border-[color:var(--color-border-subtle)] pb-3">
        <h2 className="text-xl font-semibold">{spell.name}</h2>
        <p className="text-secondary text-sm">{formatSpellLevelAndSchool(spell)}</p>
      </header>

      <dl className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Casting Time</dt>
          <dd>{spell.castingTime}</dd>
        </div>
        <div>
          <dt className="text-muted">Range</dt>
          <dd>{spell.range}</dd>
        </div>
        <div>
          <dt className="text-muted">Duration</dt>
          <dd>{spell.duration}</dd>
        </div>
        <div>
          <dt className="text-muted">Components</dt>
          <dd>{formatSpellComponents(spell)}</dd>
        </div>
        <div>
          <dt className="text-muted">Concentration</dt>
          <dd>{spell.concentration ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-muted">Ritual</dt>
          <dd>{spell.ritual ? "Yes" : "No"}</dd>
        </div>
      </dl>

      <SpellTextBlock paragraphs={spell.description} title="Description" />
      <SpellTextBlock paragraphs={spell.higherLevel ?? []} title="At Higher Levels" />

      <footer className="mt-4 border-t border-[color:var(--color-border-subtle)] pt-3 text-sm">
        <p>
          <span className="text-muted">Classes:</span> {spell.classes.join(", ")}
        </p>
        <p>
          <span className="text-muted">Source:</span> {spell.source}
        </p>
      </footer>
    </article>
  );
}
