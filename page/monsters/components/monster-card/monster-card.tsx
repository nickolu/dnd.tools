import Link from "next/link";

import { NamedTextSection } from "@/page/monsters/components/monster-card/components/named-text-section";
import { ABILITY_ORDER } from "@/page/monsters/components/monster-card/constants";
import type { MonsterCardProps } from "@/page/monsters/components/monster-card/types";
import {
  formatAbilityModifier,
  formatList,
  formatSkillBonuses,
  inferProficiencyBonus,
} from "@/page/monsters/components/monster-card/utils/formatMonster";

export function MonsterCard({
  isAdminMode = false,
  monster,
}: MonsterCardProps) {
  const proficiencyBonus =
    typeof monster.proficiencyBonus === "number"
      ? monster.proficiencyBonus
      : inferProficiencyBonus(monster.crNumeric);
  const isEstimatedProficiencyBonus =
    typeof monster.proficiencyBonus !== "number";
  const spellNames = monster.spellList ?? [];

  return (
    <article className="surface-card p-5">
      <header className="mb-4 flex items-start justify-between gap-3 border-b border-[color:var(--color-border-subtle)] pb-3">
        <div>
          <h2 className="typography-h2">{monster.name}</h2>
          <p className="typography-body-sm text-secondary">
            {monster.size} {monster.type}, {monster.alignment}
          </p>
        </div>
        {isAdminMode ? (
          <Link
            aria-label={`Edit ${monster.name}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--color-border-subtle)] text-secondary transition-colors hover:text-primary"
            href={`/admin/monsters/${encodeURIComponent(monster.id)}`}
            title="Edit monster"
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
          <dt className="text-muted">Armor Class</dt>
          <dd>{monster.armorClass}</dd>
        </div>
        <div>
          <dt className="text-muted">Hit Points</dt>
          <dd>{monster.hitPoints}</dd>
        </div>
        <div>
          <dt className="text-muted">Speed</dt>
          <dd>{monster.speed}</dd>
        </div>
        <div>
          <dt className="text-muted">Challenge</dt>
          <dd>{monster.challengeRating}</dd>
        </div>
        <div>
          <dt className="text-muted">Proficiency Bonus</dt>
          <dd>
            +{proficiencyBonus}
            {isEstimatedProficiencyBonus ? " (est.)" : ""}
          </dd>
        </div>
      </dl>

      <section className="mb-4">
        <h3 className="typography-h3 mb-2">Ability Scores</h3>
        <ul className="typography-body-sm grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
          {ABILITY_ORDER.map((ability) => {
            const score = monster.abilityScores[ability];
            const modifier = formatAbilityModifier(score);

            return (
              <li
                className="rounded-[var(--radius-sm)] border border-[color:var(--color-border-subtle)] px-2 py-2"
                key={ability}
              >
                <p className="text-muted uppercase">{ability}</p>
                <p className="typography-h3">{score}</p>
                <p className="text-secondary">({modifier})</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="typography-body-sm mb-4 grid gap-2">
        <p>
          <span className="text-muted">Senses:</span> {monster.senses ?? "None"}
        </p>
        <p>
          <span className="text-muted">Languages:</span>{" "}
          {formatList(monster.languages)}
        </p>
        <p>
          <span className="text-muted">Damage Resistances:</span>{" "}
          {formatList(monster.damageResistances)}
        </p>
        <p>
          <span className="text-muted">Damage Immunities:</span>{" "}
          {formatList(monster.damageImmunities)}
        </p>
        <p>
          <span className="text-muted">Condition Immunities:</span>{" "}
          {formatList(monster.conditionImmunities)}
        </p>
        <p>
          <span className="text-muted">Skills:</span>{" "}
          {formatSkillBonuses(monster.skills)}
        </p>
      </section>

      <NamedTextSection
        entries={monster.specialAbilities ?? []}
        spellNames={spellNames}
        title="Special Abilities"
      />
      <NamedTextSection
        entries={monster.actions ?? []}
        spellNames={spellNames}
        title="Actions"
      />
      <NamedTextSection
        entries={monster.reactions ?? []}
        spellNames={spellNames}
        title="Reactions"
      />
      <NamedTextSection
        entries={monster.legendaryActions ?? []}
        spellNames={spellNames}
        title="Legendary Actions"
      />

      <footer className="typography-body-sm mt-4 border-t border-[color:var(--color-border-subtle)] pt-3">
        <p>
          <span className="text-muted">Source:</span> {monster.source}
        </p>
      </footer>
    </article>
  );
}
