"use client";

import { useState } from "react";

import type { Monster } from "@/lib/domain/monster.schema";

type Props = {
  monster: Monster;
  expanded: boolean;
  onToggle: () => void;
};

function abilityModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

const ABILITY_LABELS: Array<{
  key: keyof Monster["abilityScores"];
  label: string;
}> = [
  { key: "str", label: "STR" },
  { key: "dex", label: "DEX" },
  { key: "con", label: "CON" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "cha", label: "CHA" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="typography-kicker"
      style={{ color: "var(--color-text-muted)", marginRight: "0.25rem" }}
    >
      {children}
    </span>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.25rem",
        alignItems: "baseline",
      }}
    >
      <SectionLabel>{label}</SectionLabel>
      <span className="typography-body-sm">{children}</span>
    </div>
  );
}

function NamedTextItem({ name, text }: { name: string; text: string }) {
  const [open, setOpen] = useState(false);
  const isLong = text.length > 120;

  return (
    <div style={{ marginBottom: "0.25rem" }}>
      <span className="typography-body-sm" style={{ fontWeight: 600 }}>
        {name}.{" "}
      </span>
      <span className="typography-body-sm">
        {isLong && !open ? `${text.slice(0, 120)}…` : text}
      </span>
      {isLong && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0 0.25rem",
            fontSize: "0.7rem",
            color: "var(--color-accent)",
            verticalAlign: "baseline",
          }}
        >
          {open ? "less" : "more"}
        </button>
      )}
    </div>
  );
}

export function MonsterStatSummary({ monster, expanded, onToggle }: Props) {
  const { abilityScores } = monster;

  return (
    <div
      style={{
        borderTop: "1px solid var(--color-border-subtle)",
        paddingTop: "0.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.375rem",
      }}
    >
      {/* Primary stats row — always visible */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        {/* Ability scores */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            flex: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {ABILITY_LABELS.map(({ key, label }) => {
            const score = abilityScores[key];
            return (
              <span
                key={key}
                className="typography-body-sm"
                style={{
                  display: "inline-flex",
                  gap: "0.2rem",
                  alignItems: "baseline",
                }}
              >
                <span
                  className="typography-kicker"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {label}
                </span>
                {score} ({abilityModifier(score)})
              </span>
            );
          })}
        </div>

        {/* Speed */}
        <span className="typography-body-sm" style={{ whiteSpace: "nowrap" }}>
          <SectionLabel>Spd</SectionLabel>
          {monster.speed}
        </span>

        {/* Spellcaster indicator */}
        {monster.spellList !== undefined && monster.spellList.length > 0 && (
          <span
            className="typography-body-sm"
            style={{ whiteSpace: "nowrap", color: "var(--color-text-muted)" }}
          >
            Spellcaster
          </span>
        )}

        {/* Toggle button */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? "Collapse stat block" : "Expand stat block"}
          style={{
            background: "none",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: "0.25rem",
            cursor: "pointer",
            padding: "0.125rem 0.375rem",
            fontSize: "0.625rem",
            color: "var(--color-text-muted)",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
            paddingTop: "0.25rem",
          }}
        >
          {/* Saving throws */}
          {monster.savingThrows !== undefined &&
            Object.keys(monster.savingThrows).length > 0 && (
              <Section label="Saves">
                {Object.entries(monster.savingThrows)
                  .map(
                    ([ability, bonus]) =>
                      `${ability.charAt(0).toUpperCase() + ability.slice(1)} ${bonus >= 0 ? `+${bonus}` : bonus}`
                  )
                  .join(", ")}
              </Section>
            )}

          {/* Skills */}
          {monster.skills !== undefined &&
            Object.keys(monster.skills).length > 0 && (
              <Section label="Skills">
                {Object.entries(monster.skills)
                  .map(
                    ([skill, bonus]) =>
                      `${skill.charAt(0).toUpperCase() + skill.slice(1)} ${bonus >= 0 ? `+${bonus}` : bonus}`
                  )
                  .join(", ")}
              </Section>
            )}

          {/* Damage vulnerabilities */}
          {monster.damageVulnerabilities !== undefined &&
            monster.damageVulnerabilities.length > 0 && (
              <Section label="Vuln">
                {monster.damageVulnerabilities.join(", ")}
              </Section>
            )}

          {/* Damage resistances */}
          {monster.damageResistances !== undefined &&
            monster.damageResistances.length > 0 && (
              <Section label="Resist">
                {monster.damageResistances.join(", ")}
              </Section>
            )}

          {/* Damage immunities */}
          {monster.damageImmunities !== undefined &&
            monster.damageImmunities.length > 0 && (
              <Section label="Immune">
                {monster.damageImmunities.join(", ")}
              </Section>
            )}

          {/* Condition immunities */}
          {monster.conditionImmunities !== undefined &&
            monster.conditionImmunities.length > 0 && (
              <Section label="Cond. Immune">
                {monster.conditionImmunities.join(", ")}
              </Section>
            )}

          {/* Senses */}
          {monster.senses !== undefined && (
            <Section label="Senses">{monster.senses}</Section>
          )}

          {/* Passive perception */}
          {monster.passivePerception !== undefined && (
            <Section label="Passive Perc.">{monster.passivePerception}</Section>
          )}

          {/* Languages */}
          {monster.languages !== undefined && monster.languages.length > 0 && (
            <Section label="Languages">{monster.languages.join(", ")}</Section>
          )}

          {/* Special abilities */}
          {monster.specialAbilities !== undefined &&
            monster.specialAbilities.length > 0 && (
              <div>
                <SectionLabel>Abilities</SectionLabel>
                <div style={{ marginTop: "0.125rem" }}>
                  {monster.specialAbilities.map((ability) => (
                    <NamedTextItem
                      key={ability.name}
                      name={ability.name}
                      text={ability.text}
                    />
                  ))}
                </div>
              </div>
            )}

          {/* Actions */}
          {monster.actions !== undefined && monster.actions.length > 0 && (
            <div>
              <SectionLabel>Actions</SectionLabel>
              <div style={{ marginTop: "0.125rem" }}>
                {monster.actions.map((action) => (
                  <NamedTextItem
                    key={action.name}
                    name={action.name}
                    text={action.text}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reactions */}
          {monster.reactions !== undefined && monster.reactions.length > 0 && (
            <div>
              <SectionLabel>Reactions</SectionLabel>
              <div style={{ marginTop: "0.125rem" }}>
                {monster.reactions.map((reaction) => (
                  <NamedTextItem
                    key={reaction.name}
                    name={reaction.name}
                    text={reaction.text}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Legendary actions */}
          {monster.legendaryActions !== undefined &&
            monster.legendaryActions.length > 0 && (
              <div>
                <SectionLabel>Legendary</SectionLabel>
                <div style={{ marginTop: "0.125rem" }}>
                  {monster.legendaryActions.map((action) => (
                    <NamedTextItem
                      key={action.name}
                      name={action.name}
                      text={action.text}
                    />
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
