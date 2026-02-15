import Link from "next/link";

import { SpellTextBlock } from "@/page/spells/components/spell-card/components/spell-text-block";
import type { SpellCardProps } from "@/page/spells/components/spell-card/types";
import {
  formatSpellComponents,
  formatSpellLevelAndSchool,
} from "@/page/spells/components/spell-card/utils/formatSpell";

export function SpellCard({ isAdminMode = false, spell }: SpellCardProps) {
  return (
    <article className="surface-card p-5">
      <header className="mb-4 flex items-start justify-between gap-3 border-b border-[color:var(--color-border-subtle)] pb-3">
        <div>
          <h2 className="typography-h2">{spell.name}</h2>
          <p className="typography-body-sm text-secondary">
            {formatSpellLevelAndSchool(spell)}
          </p>
        </div>
        {isAdminMode ? (
          <Link
            aria-label={`Edit ${spell.name}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--color-border-subtle)] text-secondary transition-colors hover:text-primary"
            href={`/admin/spells/${encodeURIComponent(spell.id)}`}
            title="Edit spell"
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              width="16"
            >
              <path d="M12 20h9" />
              <path d="m16.5 3.5 4 4L8 20l-5 1 1-5 12.5-12.5Z" />
            </svg>
          </Link>
        ) : null}
      </header>

      <dl className="typography-body-sm mb-4 grid gap-3 sm:grid-cols-2">
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
      <SpellTextBlock
        paragraphs={spell.higherLevel ?? []}
        title="At Higher Levels"
      />

      <footer className="typography-body-sm mt-4 border-t border-[color:var(--color-border-subtle)] pt-3">
        <p>
          <span className="text-muted">Classes:</span>{" "}
          {spell.classes.join(", ")}
        </p>
        <p>
          <span className="text-muted">Source:</span> {spell.source}
        </p>
      </footer>
    </article>
  );
}
