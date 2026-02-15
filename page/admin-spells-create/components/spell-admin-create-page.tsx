"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import {
  DEFAULT_SPELL_ADMIN_FORM,
  SPELL_SCHOOLS,
} from "@/page/admin-spells-create/constants";
import type {
  AdminEntryMode,
  SpellAdminFormState,
} from "@/page/admin-spells-create/types";
import {
  toSpellFormState,
  toSpellPayload,
} from "@/page/admin-spells-create/utils/form-state";

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

const isSpellSchool = (value: string): value is SpellAdminFormState["school"] =>
  SPELL_SCHOOLS.some((school) => school === value);

const isAttackType = (
  value: string
): value is SpellAdminFormState["attackType"] =>
  value === "" || value === "melee" || value === "ranged";

const isSaveAbility = (
  value: string
): value is SpellAdminFormState["saveAbility"] =>
  value === "" ||
  value === "str" ||
  value === "dex" ||
  value === "con" ||
  value === "int" ||
  value === "wis" ||
  value === "cha";

type SpellAdminEntryPageProps = {
  entryId?: string;
};

export function SpellAdminCreatePage() {
  return <SpellAdminEntryPage />;
}

export function SpellAdminEditPage({ entryId }: { entryId: string }) {
  return <SpellAdminEntryPage entryId={entryId} />;
}

function SpellAdminEntryPage({ entryId }: SpellAdminEntryPageProps) {
  const isEditing = Boolean(entryId);
  const [mode, setMode] = useState<AdminEntryMode>(
    isEditing ? "manual" : "parse"
  );
  const [rawText, setRawText] = useState("");
  const [formState, setFormState] = useState<SpellAdminFormState>(
    isEditing && entryId
      ? {
          ...DEFAULT_SPELL_ADMIN_FORM,
          id: entryId,
        }
      : DEFAULT_SPELL_ADMIN_FORM
  );
  const [isEntryLoading, setIsEntryLoading] = useState(isEditing);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftValidation, setDraftValidation] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const payloadPreview = useMemo(() => toSpellPayload(formState), [formState]);

  useEffect(() => {
    if (!entryId) {
      return;
    }

    let isCancelled = false;

    const loadSpell = async () => {
      setIsEntryLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const response = await fetch(
          `/api/spells/${encodeURIComponent(entryId)}`,
          {
            headers: {
              "x-dnd-role": ROLE_HEADER,
            },
            method: "GET",
          }
        );
        const spell = await parseEnvelope(response);

        if (isCancelled) {
          return;
        }

        setFormState(toSpellFormState(spell));
        setMode("manual");
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load spell."
        );
      } finally {
        if (!isCancelled) {
          setIsEntryLoading(false);
        }
      }
    };

    void loadSpell();

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
      setErrorMessage("Paste spell text first.");
      return;
    }

    setIsDraftLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setDraftValidation(null);

    try {
      const response = await fetch("/api/admin/spells/draft", {
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
      setFormState(toSpellFormState(data.draft));
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

  const submitSpell = async () => {
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
        ? `/api/spells/${encodeURIComponent(entryId)}`
        : "/api/spells";
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
          ? `Updated spell '${payload.id}'.`
          : `Saved spell '${payload.id}'.`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save spell."
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
          {isEditing ? "Edit Spell" : "Create Spell"}
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
            Loading spell...
          </p>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="typography-body-sm text-secondary">Actor</span>
            <input
              className="input-field px-3 py-2"
              onChange={(event) => {
                applyActor(event.target.value);
              }}
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
                Unstructured spell text
              </span>
              <textarea
                className="admin-textarea px-3 py-2"
                onChange={(event) => setRawText(event.target.value)}
                placeholder="Paste spell text..."
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
                disabled={isEditing}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    id: event.target.value,
                  }))
                }
                value={formState.id}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">Level</span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    level: event.target.value,
                  }))
                }
                value={formState.level}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">School</span>
              <select
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    school: isSpellSchool(event.target.value)
                      ? event.target.value
                      : current.school,
                  }))
                }
                value={formState.school}
              >
                {SPELL_SCHOOLS.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Casting time
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    castingTime: event.target.value,
                  }))
                }
                value={formState.castingTime}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">Range</span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    range: event.target.value,
                  }))
                }
                value={formState.range}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Duration
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    duration: event.target.value,
                  }))
                }
                value={formState.duration}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Classes (comma)
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    classesText: event.target.value,
                  }))
                }
                value={formState.classesText}
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
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Publisher
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    publisher: event.target.value,
                  }))
                }
                value={formState.publisher}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Description (one line per paragraph)
              </span>
              <textarea
                className="admin-textarea px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    descriptionText: event.target.value,
                  }))
                }
                rows={6}
                value={formState.descriptionText}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Higher level (one line per paragraph)
              </span>
              <textarea
                className="admin-textarea px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    higherLevelText: event.target.value,
                  }))
                }
                rows={6}
                value={formState.higherLevelText}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="flex items-center gap-2 pt-6">
              <input
                checked={formState.componentVerbal}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    componentVerbal: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span className="typography-body-sm text-secondary">Verbal</span>
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input
                checked={formState.componentSomatic}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    componentSomatic: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span className="typography-body-sm text-secondary">Somatic</span>
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input
                checked={formState.componentMaterial}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    componentMaterial: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span className="typography-body-sm text-secondary">
                Material
              </span>
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input
                checked={formState.concentration}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    concentration: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span className="typography-body-sm text-secondary">
                Concentration
              </span>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Material text
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    materialText: event.target.value,
                  }))
                }
                value={formState.materialText}
              />
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input
                checked={formState.ritual}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    ritual: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span className="typography-body-sm text-secondary">Ritual</span>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Attack type
              </span>
              <select
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    attackType: isAttackType(event.target.value)
                      ? event.target.value
                      : current.attackType,
                  }))
                }
                value={formState.attackType}
              >
                <option value="">None</option>
                <option value="melee">melee</option>
                <option value="ranged">ranged</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Save ability
              </span>
              <select
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    saveAbility: isSaveAbility(event.target.value)
                      ? event.target.value
                      : current.saveAbility,
                  }))
                }
                value={formState.saveAbility}
              >
                <option value="">None</option>
                <option value="str">str</option>
                <option value="dex">dex</option>
                <option value="con">con</option>
                <option value="int">int</option>
                <option value="wis">wis</option>
                <option value="cha">cha</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Save on success
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    saveOnSuccess: event.target.value,
                  }))
                }
                value={formState.saveOnSuccess}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Damage type
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    damageType: event.target.value,
                  }))
                }
                value={formState.damageType}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">GP cost</span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    gpCost: event.target.value,
                  }))
                }
                value={formState.gpCost}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Tags (comma)
              </span>
              <input
                className="input-field px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    tagsText: event.target.value,
                  }))
                }
                value={formState.tagsText}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Damage dice by slot (`level: dice` per line)
              </span>
              <textarea
                className="admin-textarea px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    diceBySlotText: event.target.value,
                  }))
                }
                rows={4}
                value={formState.diceBySlotText}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Cantrip scaling (`level: dice` per line)
              </span>
              <textarea
                className="admin-textarea px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    cantripScalingText: event.target.value,
                  }))
                }
                rows={4}
                value={formState.cantripScalingText}
              />
            </label>
          </div>

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

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            className="admin-button px-4 py-2 typography-body-sm"
            disabled={isEntryLoading || isSubmitting}
            onClick={submitSpell}
            type="button"
          >
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Update spell"
                : "Save spell"}
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
