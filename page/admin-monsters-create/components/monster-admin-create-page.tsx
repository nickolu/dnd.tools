"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import {
  DEFAULT_MONSTER_ADMIN_FORM,
  MONSTER_SIZES,
} from "@/page/admin-monsters-create/constants";
import type {
  AdminEntryMode,
  MonsterAdminFormState,
} from "@/page/admin-monsters-create/types";
import {
  toMonsterFormState,
  toMonsterPayload,
} from "@/page/admin-monsters-create/utils/form-state";

const draftResponseSchema = z.object({
  draft: z.unknown(),
  isValid: z.boolean(),
  validationErrors: z.unknown(),
});

const ROLE_HEADER = "admin";

const responseEnvelopeSchema = z.union([
  z.object({
    data: z.unknown(),
    ok: z.literal(true),
  }),
  z.object({
    error: z.object({
      details: z.unknown().optional(),
      message: z.string(),
    }),
    ok: z.literal(false),
  }),
]);

const parseEnvelope = async (response: Response): Promise<unknown> => {
  const payload = responseEnvelopeSchema.parse(await response.json());
  if (!payload.ok) {
    throw new Error(payload.error.message);
  }

  return payload.data;
};

const isMonsterSize = (value: string): value is MonsterAdminFormState["size"] =>
  MONSTER_SIZES.some((size) => size === value);

type MonsterAdminEntryPageProps = {
  entryId?: string;
};

export function MonsterAdminCreatePage() {
  return <MonsterAdminEntryPage />;
}

export function MonsterAdminEditPage({ entryId }: { entryId: string }) {
  return <MonsterAdminEntryPage entryId={entryId} />;
}

function MonsterAdminEntryPage({ entryId }: MonsterAdminEntryPageProps) {
  const isEditing = Boolean(entryId);
  const [mode, setMode] = useState<AdminEntryMode>(
    isEditing ? "manual" : "parse"
  );
  const [rawText, setRawText] = useState("");
  const [formState, setFormState] = useState<MonsterAdminFormState>(
    isEditing && entryId
      ? {
          ...DEFAULT_MONSTER_ADMIN_FORM,
          id: entryId,
        }
      : DEFAULT_MONSTER_ADMIN_FORM
  );
  const [isEntryLoading, setIsEntryLoading] = useState(isEditing);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftValidation, setDraftValidation] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const payloadPreview = useMemo(
    () => toMonsterPayload(formState),
    [formState]
  );

  useEffect(() => {
    if (!entryId) {
      return;
    }

    let isCancelled = false;

    const loadMonster = async () => {
      setIsEntryLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const response = await fetch(
          `/api/monsters/${encodeURIComponent(entryId)}`,
          {
            headers: {
              "x-dnd-role": ROLE_HEADER,
            },
            method: "GET",
          }
        );
        const monster = await parseEnvelope(response);

        if (isCancelled) {
          return;
        }

        setFormState(toMonsterFormState(monster));
        setMode("manual");
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load monster."
        );
      } finally {
        if (!isCancelled) {
          setIsEntryLoading(false);
        }
      }
    };

    void loadMonster();

    return () => {
      isCancelled = true;
    };
  }, [entryId]);

  const applyActor = (actor: string) => {
    setFormState((current) => ({
      ...current,
      actor,
      createdBy: actor,
      updatedBy: actor,
    }));
  };

  const fetchDraft = async () => {
    if (!rawText.trim()) {
      setErrorMessage("Paste monster text first.");
      return;
    }

    setIsDraftLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setDraftValidation(null);

    try {
      const response = await fetch("/api/admin/monsters/draft", {
        body: JSON.stringify({
          actor: formState.actor,
          isPublished: formState.isPublished,
          rawText,
          schemaVersion: Number(formState.schemaVersion) || 1,
          source: formState.source || "SRD 5.1",
        }),
        headers: {
          "Content-Type": "application/json",
          "x-dnd-role": ROLE_HEADER,
        },
        method: "POST",
      });

      const data = draftResponseSchema.parse(await parseEnvelope(response));
      setFormState(toMonsterFormState(data.draft));
      if (!data.isValid) {
        setDraftValidation(
          "Draft generated, but some required fields are missing. Review and edit before saving."
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to generate draft."
      );
    } finally {
      setIsDraftLoading(false);
    }
  };

  const submitMonster = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const payload = payloadPreview;
    if (!payload) {
      setErrorMessage(
        "Form is incomplete. Fill required fields before saving."
      );
      return;
    }
    if (entryId && payload.id !== entryId) {
      setErrorMessage("ID cannot be changed while editing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = entryId
        ? `/api/monsters/${encodeURIComponent(entryId)}`
        : "/api/monsters";
      const response = await fetch(endpoint, {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "x-dnd-role": ROLE_HEADER,
        },
        method: entryId ? "PUT" : "POST",
      });

      await parseEnvelope(response);
      setSuccessMessage(
        entryId
          ? `Updated monster '${payload.id}'.`
          : `Saved monster '${payload.id}'.`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save monster."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <section className="surface-card p-6">
        <p className="typography-kicker text-muted">Admin</p>
        <h1 className="typography-h1">
          {isEditing ? "Edit Monster" : "Create Monster"}
        </h1>
        <p className="typography-body mt-2 text-secondary">
          Hidden route for admin ingestion and maintenance. Not linked from
          navigation.
        </p>

        {!isEditing ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="admin-button-secondary px-3 py-2 typography-body-sm"
              data-active={mode === "parse"}
              onClick={() => setMode("parse")}
              type="button"
            >
              Parse text
            </button>
            <button
              className="admin-button-secondary px-3 py-2 typography-body-sm"
              data-active={mode === "manual"}
              onClick={() => setMode("manual")}
              type="button"
            >
              Manual form
            </button>
          </div>
        ) : null}

        {isEntryLoading ? (
          <p className="mt-4 typography-body-sm text-secondary">
            Loading monster...
          </p>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="typography-body-sm text-secondary">Actor</span>
            <input
              className="input-field px-3 py-2"
              onChange={(event) => applyActor(event.target.value)}
              value={formState.actor}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="typography-body-sm text-secondary">
              Schema version
            </span>
            <input
              className="input-field px-3 py-2"
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  schemaVersion: event.target.value,
                }))
              }
              value={formState.schemaVersion}
            />
          </label>
          <label className="flex items-center gap-2 pt-6">
            <input
              checked={formState.isPublished}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  isPublished: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span className="typography-body-sm text-secondary">Published</span>
          </label>
        </div>

        {!isEditing && mode === "parse" ? (
          <div className="mt-4 space-y-3">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Unstructured monster text
              </span>
              <textarea
                className="admin-textarea px-3 py-2"
                onChange={(event) => setRawText(event.target.value)}
                placeholder="Paste monster text..."
                rows={10}
                value={rawText}
              />
            </label>
            <button
              className="admin-button px-4 py-2 typography-body-sm"
              disabled={isDraftLoading}
              onClick={fetchDraft}
              type="button"
            >
              {isDraftLoading ? "Generating..." : "Generate draft"}
            </button>
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          <h2 className="typography-h2">Review and Edit</h2>

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
              <span className="typography-body-sm text-secondary">ID</span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    id: event.target.value,
                  }))
                }
                disabled={isEditing}
                value={formState.id}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
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
                Armor class
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
                Hit points
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

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Challenge rating
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
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                CR numeric
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
          </div>

          <div className="grid gap-3 md:grid-cols-6">
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

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Languages (comma)
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
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Passive perception
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    passivePerception: event.target.value,
                  }))
                }
                value={formState.passivePerception}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Proficiency bonus
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    proficiencyBonus: event.target.value,
                  }))
                }
                value={formState.proficiencyBonus}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Spell slots (comma integers)
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    spellSlotsText: event.target.value,
                  }))
                }
                value={formState.spellSlotsText}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Saving throws (`name: value` per line)
              </span>
              <textarea
                className="admin-textarea px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    savingThrowsText: event.target.value,
                  }))
                }
                rows={4}
                value={formState.savingThrowsText}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Skills (`name: value` per line)
              </span>
              <textarea
                className="admin-textarea px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    skillsText: event.target.value,
                  }))
                }
                rows={4}
                value={formState.skillsText}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Damage resistances (comma)
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
                Damage immunities (comma)
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
                Damage vulnerabilities (comma)
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    damageVulnerabilitiesText: event.target.value,
                  }))
                }
                value={formState.damageVulnerabilitiesText}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Condition immunities (comma)
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
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Spell list (comma)
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    spellListText: event.target.value,
                  }))
                }
                value={formState.spellListText}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Search tokens (comma)
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    searchTokensText: event.target.value,
                  }))
                }
                value={formState.searchTokensText}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Special abilities JSON
              </span>
              <textarea
                className="admin-textarea px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    specialAbilitiesJson: event.target.value,
                  }))
                }
                rows={6}
                value={formState.specialAbilitiesJson}
              />
            </label>
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
                rows={6}
                value={formState.actionsJson}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
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
                rows={5}
                value={formState.reactionsJson}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Legendary actions JSON
              </span>
              <textarea
                className="admin-textarea px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    legendaryActionsJson: event.target.value,
                  }))
                }
                rows={5}
                value={formState.legendaryActionsJson}
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            className="admin-button px-4 py-2 typography-body-sm"
            disabled={isEntryLoading || isSubmitting}
            onClick={submitMonster}
            type="button"
          >
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Update monster"
                : "Save monster"}
          </button>
          {payloadPreview ? (
            <span className="typography-body-sm text-secondary">
              Ready to save as `{payloadPreview.id}`.
            </span>
          ) : (
            <span className="typography-body-sm text-muted">
              Required fields are incomplete.
            </span>
          )}
        </div>

        {draftValidation ? (
          <p className="mt-3 typography-body-sm text-secondary">
            {draftValidation}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mt-3 typography-body-sm text-secondary">
            {errorMessage}
          </p>
        ) : null}
        {successMessage ? (
          <p className="mt-3 typography-body-sm">{successMessage}</p>
        ) : null}
      </section>
    </main>
  );
}
