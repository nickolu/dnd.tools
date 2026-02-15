import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MONSTER_SIZES } from "@/page/admin-monsters-create/constants";
import {
  toMonsterFormState,
  toMonsterPayload,
} from "@/page/admin-monsters-create/utils/form-state";
import { NamedTextSection } from "@/page/monsters/components/monster-card/components/named-text-section";
import { ABILITY_ORDER } from "@/page/monsters/components/monster-card/constants";
import type { MonsterCardProps } from "@/page/monsters/components/monster-card/types";
import {
  formatAbilityModifier,
  formatList,
  formatSkillBonuses,
  inferProficiencyBonus,
} from "@/page/monsters/components/monster-card/utils/formatMonster";

const ROLE_HEADER = "admin";

const parseEnvelope = async (response: Response): Promise<unknown> => {
  const payload = await response.json();

  if (!payload || typeof payload !== "object" || !("ok" in payload)) {
    throw new Error("Invalid response payload.");
  }

  if (payload.ok !== true) {
    const error =
      "error" in payload && payload.error && typeof payload.error === "object"
        ? payload.error
        : null;
    const message =
      error && "message" in error && typeof error.message === "string"
        ? error.message
        : "Failed to save monster.";
    throw new Error(message);
  }

  if (!("data" in payload)) {
    throw new Error("Invalid response payload.");
  }

  return payload.data;
};

const isMonsterSize = (
  value: string
): value is (typeof MONSTER_SIZES)[number] =>
  MONSTER_SIZES.some((size) => size === value);

export function MonsterCard({
  isAdminMode = false,
  onMonsterUpdated,
  monster,
}: MonsterCardProps) {
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState(() => toMonsterFormState(monster));

  const hasSpecialAbilitiesField = useMemo(
    () =>
      Boolean(
        monster.specialAbilities?.length ||
        formState.specialAbilitiesJson.trim()
      ),
    [formState.specialAbilitiesJson, monster.specialAbilities]
  );
  const hasActionsField = useMemo(
    () => Boolean(monster.actions?.length || formState.actionsJson.trim()),
    [formState.actionsJson, monster.actions]
  );
  const hasReactionsField = useMemo(
    () => Boolean(monster.reactions?.length || formState.reactionsJson.trim()),
    [formState.reactionsJson, monster.reactions]
  );
  const hasLegendaryActionsField = useMemo(
    () =>
      Boolean(
        monster.legendaryActions?.length ||
        formState.legendaryActionsJson.trim()
      ),
    [formState.legendaryActionsJson, monster.legendaryActions]
  );

  useEffect(() => {
    if (isInlineEditing) {
      return;
    }

    setFormState(toMonsterFormState(monster));
  }, [isInlineEditing, monster]);

  const cancelInlineEdit = () => {
    setIsInlineEditing(false);
    setIsSaving(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setFormState(toMonsterFormState(monster));
  };

  const submitInlineEdit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const payload = toMonsterPayload(formState);

    if (!payload) {
      setErrorMessage(
        "Required fields are incomplete. Review and complete the values."
      );
      return;
    }

    if (payload.id !== monster.id) {
      setErrorMessage("Monster ID cannot be changed in inline edit mode.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/monsters/${encodeURIComponent(monster.id)}`,
        {
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
            "x-dnd-role": ROLE_HEADER,
          },
          method: "PUT",
        }
      );

      await parseEnvelope(response);
      if (onMonsterUpdated) {
        await onMonsterUpdated();
      }

      setSuccessMessage("Monster updated.");
      setIsInlineEditing(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update monster."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const proficiencyBonus =
    typeof monster.proficiencyBonus === "number"
      ? monster.proficiencyBonus
      : inferProficiencyBonus(monster.crNumeric);
  const isEstimatedProficiencyBonus =
    typeof monster.proficiencyBonus !== "number";
  const spellNames = monster.spellList ?? [];

  if (isInlineEditing) {
    return (
      <article className="surface-card p-5">
        <header className="mb-4 flex items-start justify-between gap-3 border-b border-[color:var(--color-border-subtle)] pb-3">
          <div>
            <h2 className="typography-h2">Quick Edit</h2>
            <p className="typography-body-sm text-secondary">{monster.name}</p>
          </div>
          <Link
            className="admin-button-secondary typography-body-sm px-3 py-1"
            href={`/admin/monsters/${encodeURIComponent(monster.id)}`}
          >
            Open full editor
          </Link>
        </header>

        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">Name</span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                value={formState.name}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">Type</span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
                value={formState.type}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">Size</span>
              <select
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    size: isMonsterSize(event.target.value)
                      ? event.target.value
                      : current.size,
                  }))
                }
                value={formState.size}
              >
                {MONSTER_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Alignment
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    alignment: event.target.value,
                  }))
                }
                value={formState.alignment}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Armor Class
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    armorClass: event.target.value,
                  }))
                }
                value={formState.armorClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Hit Points
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    hitPoints: event.target.value,
                  }))
                }
                value={formState.hitPoints}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">Speed</span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    speed: event.target.value,
                  }))
                }
                value={formState.speed}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Challenge
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    challengeRating: event.target.value,
                  }))
                }
                value={formState.challengeRating}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                CR Numeric
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    crNumeric: event.target.value,
                  }))
                }
                value={formState.crNumeric}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Proficiency Bonus (optional)
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    proficiencyBonus: event.target.value,
                  }))
                }
                placeholder="Leave blank to infer"
                value={formState.proficiencyBonus}
              />
            </label>
          </div>

          <section>
            <h3 className="typography-h3 mb-2">Ability Scores</h3>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="typography-body-sm text-secondary">STR</span>
                <input
                  className="input-field px-3 py-2"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      abilityStr: event.target.value,
                    }))
                  }
                  value={formState.abilityStr}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="typography-body-sm text-secondary">DEX</span>
                <input
                  className="input-field px-3 py-2"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      abilityDex: event.target.value,
                    }))
                  }
                  value={formState.abilityDex}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="typography-body-sm text-secondary">CON</span>
                <input
                  className="input-field px-3 py-2"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      abilityCon: event.target.value,
                    }))
                  }
                  value={formState.abilityCon}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="typography-body-sm text-secondary">INT</span>
                <input
                  className="input-field px-3 py-2"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      abilityInt: event.target.value,
                    }))
                  }
                  value={formState.abilityInt}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="typography-body-sm text-secondary">WIS</span>
                <input
                  className="input-field px-3 py-2"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      abilityWis: event.target.value,
                    }))
                  }
                  value={formState.abilityWis}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="typography-body-sm text-secondary">CHA</span>
                <input
                  className="input-field px-3 py-2"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      abilityCha: event.target.value,
                    }))
                  }
                  value={formState.abilityCha}
                />
              </label>
            </div>
          </section>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">Senses</span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    senses: event.target.value,
                  }))
                }
                value={formState.senses}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Languages (comma separated)
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    languagesText: event.target.value,
                  }))
                }
                value={formState.languagesText}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Damage Resistances (comma separated)
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    damageResistancesText: event.target.value,
                  }))
                }
                value={formState.damageResistancesText}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Damage Immunities (comma separated)
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    damageImmunitiesText: event.target.value,
                  }))
                }
                value={formState.damageImmunitiesText}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Condition Immunities (comma separated)
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    conditionImmunitiesText: event.target.value,
                  }))
                }
                value={formState.conditionImmunitiesText}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Skills (`name: bonus` per line)
              </span>
              <textarea
                className="admin-textarea px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    skillsText: event.target.value,
                  }))
                }
                rows={3}
                value={formState.skillsText}
              />
            </label>
          </div>

          {hasSpecialAbilitiesField ? (
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Special Abilities JSON
              </span>
              <textarea
                className="admin-textarea px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    specialAbilitiesJson: event.target.value,
                  }))
                }
                rows={5}
                value={formState.specialAbilitiesJson}
              />
            </label>
          ) : null}
          {hasActionsField ? (
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Actions JSON
              </span>
              <textarea
                className="admin-textarea px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    actionsJson: event.target.value,
                  }))
                }
                rows={5}
                value={formState.actionsJson}
              />
            </label>
          ) : null}
          {hasReactionsField ? (
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Reactions JSON
              </span>
              <textarea
                className="admin-textarea px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    reactionsJson: event.target.value,
                  }))
                }
                rows={4}
                value={formState.reactionsJson}
              />
            </label>
          ) : null}
          {hasLegendaryActionsField ? (
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Legendary Actions JSON
              </span>
              <textarea
                className="admin-textarea px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    legendaryActionsJson: event.target.value,
                  }))
                }
                rows={4}
                value={formState.legendaryActionsJson}
              />
            </label>
          ) : null}

          <label className="flex flex-col gap-1">
            <span className="typography-body-sm text-secondary">Source</span>
            <input
              className="input-field px-3 py-2"
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  source: event.target.value,
                }))
              }
              value={formState.source}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            className="admin-button typography-body-sm px-3 py-1"
            disabled={isSaving}
            onClick={() => {
              void submitInlineEdit();
            }}
            type="button"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
          <button
            className="admin-button-secondary typography-body-sm px-3 py-1"
            disabled={isSaving}
            onClick={cancelInlineEdit}
            type="button"
          >
            Cancel
          </button>
        </div>

        {errorMessage ? (
          <p className="mt-3 typography-body-sm text-secondary">
            {errorMessage}
          </p>
        ) : null}
        {successMessage ? (
          <p className="mt-3 typography-body-sm">{successMessage}</p>
        ) : null}
      </article>
    );
  }

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
          <button
            aria-label={`Edit ${monster.name}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--color-border-subtle)] text-secondary transition-colors hover:text-primary"
            onClick={() => {
              setErrorMessage(null);
              setSuccessMessage(null);
              setFormState(toMonsterFormState(monster));
              setIsInlineEditing(true);
            }}
            title="Edit monster"
            type="button"
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
          </button>
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
