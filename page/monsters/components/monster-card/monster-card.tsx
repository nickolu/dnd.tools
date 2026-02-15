import { NamedTextSection } from "@/page/monsters/components/monster-card/components/named-text-section";
import { ABILITY_ORDER } from "@/page/monsters/components/monster-card/constants";
import type { MonsterCardProps } from "@/page/monsters/components/monster-card/types";
import {
  formatAbilityModifier,
  formatList,
} from "@/page/monsters/components/monster-card/utils/formatMonster";

export function MonsterCard({ monster }: MonsterCardProps) {
  return (
    <article className="surface-card p-5">
      <header className="mb-4 border-b border-[color:var(--color-border-subtle)] pb-3">
        <h2 className="text-xl font-semibold">{monster.name}</h2>
        <p className="text-secondary text-sm">
          {monster.size} {monster.type}, {monster.alignment}
        </p>
      </header>

      <dl className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
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
      </dl>

      <section className="mb-4">
        <h3 className="mb-2 text-base font-semibold">Ability Scores</h3>
        <ul className="grid grid-cols-3 gap-2 text-center text-sm sm:grid-cols-6">
          {ABILITY_ORDER.map((ability) => {
            const score = monster.abilityScores[ability];
            const modifier = formatAbilityModifier(score);

            return (
              <li
                className="rounded-[var(--radius-sm)] border border-[color:var(--color-border-subtle)] px-2 py-2"
                key={ability}
              >
                <p className="text-muted uppercase">{ability}</p>
                <p className="font-semibold">{score}</p>
                <p className="text-secondary">({modifier})</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mb-4 grid gap-2 text-sm">
        <p>
          <span className="text-muted">Senses:</span> {monster.senses ?? "None"}
        </p>
        <p>
          <span className="text-muted">Languages:</span> {formatList(monster.languages)}
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
      </section>

      <NamedTextSection entries={monster.specialAbilities ?? []} title="Special Abilities" />
      <NamedTextSection entries={monster.actions ?? []} title="Actions" />
      <NamedTextSection entries={monster.reactions ?? []} title="Reactions" />
      <NamedTextSection entries={monster.legendaryActions ?? []} title="Legendary Actions" />

      <footer className="mt-4 border-t border-[color:var(--color-border-subtle)] pt-3 text-sm">
        <p>
          <span className="text-muted">Source:</span> {monster.source}
        </p>
      </footer>
    </article>
  );
}
