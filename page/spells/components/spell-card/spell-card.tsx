import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { upsertCollectionCacheEntry } from "@/lib/api/client";
import { type Spell, spellSchema } from "@/lib/domain/spell.schema";
import { queryKeys } from "@/lib/query/keys";
import { SPELL_SCHOOLS } from "@/page/admin-spells-create/constants";
import {
  toSpellFormState,
  toSpellPayload,
} from "@/page/admin-spells-create/utils/form-state";
import { SpellListToggle } from "@/page/spells/components/spell-card/components/spell-list-toggle";
import { SpellTextBlock } from "@/page/spells/components/spell-card/components/spell-text-block";
import type { SpellCardProps } from "@/page/spells/components/spell-card/types";
import {
  formatSpellComponents,
  formatSpellLevelAndSchool,
} from "@/page/spells/components/spell-card/utils/formatSpell";

const ROLE_HEADER = "admin";

const splitByLines = (value: string): string[] =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const isSpellSchool = (
  value: string
): value is (typeof SPELL_SCHOOLS)[number] =>
  SPELL_SCHOOLS.some((school) => school === value);

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
        : "Failed to save spell.";
    throw new Error(message);
  }

  if (!("data" in payload)) {
    throw new Error("Invalid response payload.");
  }

  return payload.data;
};

export function SpellCard({
  detailHref,
  isAdminMode = false,
  onSpellUpdated,
  spell,
}: SpellCardProps) {
  const queryClient = useQueryClient();
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState(() => toSpellFormState(spell));
  const hasPublisherField = useMemo(
    () => Boolean(spell.publisher || formState.publisher.trim()),
    [formState.publisher, spell.publisher]
  );
  const hasHigherLevelField = useMemo(
    () =>
      Boolean(spell.higherLevel?.length || formState.higherLevelText.trim()),
    [formState.higherLevelText, spell.higherLevel]
  );

  useEffect(() => {
    if (isInlineEditing) {
      return;
    }

    setFormState(toSpellFormState(spell));
  }, [isInlineEditing, spell]);

  const cancelInlineEdit = () => {
    setIsInlineEditing(false);
    setIsSaving(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setFormState(toSpellFormState(spell));
  };

  const submitInlineEdit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const payload = toSpellPayload(formState);

    if (!payload) {
      setErrorMessage(
        "Required fields are incomplete. Review and complete the values."
      );
      return;
    }

    if (payload.id !== spell.id) {
      setErrorMessage("Spell ID cannot be changed in inline edit mode.");
      return;
    }

    const listQueryKey = queryKeys.spells;
    const detailQueryKey = queryKeys.spell(spell.id);
    const previousSpellList = queryClient.getQueryData<Spell[]>(listQueryKey);
    const previousSpellDetail = queryClient.getQueryData<Spell>(detailQueryKey);

    const optimisticTimestamp = new Date().toISOString();
    const optimisticSpell: Spell = {
      ...payload,
      createdAt: spell.createdAt,
      createdBy: spell.createdBy,
      updatedAt: optimisticTimestamp,
    };

    queryClient.setQueryData(detailQueryKey, optimisticSpell);
    queryClient.setQueryData<Spell[] | undefined>(listQueryKey, (current) =>
      current
        ? current.map((candidate) =>
            candidate.id === spell.id ? optimisticSpell : candidate
          )
        : current
    );

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/spells/${encodeURIComponent(spell.id)}`,
        {
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
            "x-dnd-role": ROLE_HEADER,
          },
          method: "PUT",
        }
      );

      const parsedResponse = await parseEnvelope(response);
      const updatedSpell = spellSchema.parse(parsedResponse);

      queryClient.setQueryData(detailQueryKey, updatedSpell);
      queryClient.setQueryData<Spell[] | undefined>(listQueryKey, (current) =>
        current
          ? current.map((candidate) =>
              candidate.id === spell.id ? updatedSpell : candidate
            )
          : current
      );
      await upsertCollectionCacheEntry("spells", updatedSpell);

      if (onSpellUpdated) {
        await onSpellUpdated();
      }

      setSuccessMessage("Spell updated.");
      setIsInlineEditing(false);
    } catch (error) {
      if (previousSpellDetail) {
        queryClient.setQueryData(detailQueryKey, previousSpellDetail);
      }
      queryClient.setQueryData(listQueryKey, previousSpellList);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update spell."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isInlineEditing) {
    return (
      <article className="surface-card p-5">
        <header className="mb-4 flex items-start justify-between gap-3 border-b border-[color:var(--color-border-subtle)] pb-3">
          <div>
            <h2 className="typography-h2">Quick Edit</h2>
            <p className="typography-body-sm text-secondary">{spell.name}</p>
          </div>
          <Link
            className="admin-button-secondary typography-body-sm px-3 py-1"
            href={`/admin/spells/${encodeURIComponent(spell.id)}`}
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
              <span className="typography-body-sm text-secondary">
                Casting Time
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
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Components
              </span>
              <div className="flex flex-wrap gap-4 rounded-[var(--radius-sm)] border border-[color:var(--color-border-subtle)] px-3 py-2">
                <label className="flex items-center gap-2">
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
                  <span className="typography-body-sm text-secondary">V</span>
                </label>
                <label className="flex items-center gap-2">
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
                  <span className="typography-body-sm text-secondary">S</span>
                </label>
                <label className="flex items-center gap-2">
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
                  <span className="typography-body-sm text-secondary">M</span>
                </label>
              </div>
            </label>
            {formState.componentMaterial ? (
              <label className="flex flex-col gap-1">
                <span className="typography-body-sm text-secondary">
                  Material Text
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
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2">
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
            <label className="flex items-center gap-2">
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
              rows={5}
              value={formState.descriptionText}
            />
          </label>

          {hasHigherLevelField ? (
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                At Higher Levels (one line per paragraph)
              </span>
              <textarea
                className="admin-textarea px-3 py-2"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    higherLevelText: event.target.value,
                  }))
                }
                rows={3}
                value={formState.higherLevelText}
              />
            </label>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="typography-body-sm text-secondary">
                Classes (comma separated)
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
          </div>

          {hasPublisherField ? (
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
          ) : null}
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
          <p className="typography-body-sm text-muted">
            Description lines: {splitByLines(formState.descriptionText).length}
          </p>
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
          <h2 className="typography-h2">{spell.name}</h2>
          <p className="typography-body-sm text-secondary">
            {formatSpellLevelAndSchool(spell)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {detailHref ? (
            <Link
              aria-label={`Open ${spell.name} detail page`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--color-border-subtle)] text-secondary transition-colors hover:text-text-primary"
              href={detailHref}
              title="Open detail page"
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
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" x2="21" y1="14" y2="3" />
              </svg>
            </Link>
          ) : null}
          <SpellListToggle spellId={spell.id} spellName={spell.name} />
          {isAdminMode ? (
            <button
              aria-label={`Edit ${spell.name}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--color-border-subtle)] text-secondary transition-colors hover:text-text-primary"
              onClick={() => {
                setErrorMessage(null);
                setSuccessMessage(null);
                setFormState(toSpellFormState(spell));
                setIsInlineEditing(true);
              }}
              title="Edit spell"
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
        </div>
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
        {spell.publisher ? (
          <p>
            <span className="text-muted">Publisher:</span> {spell.publisher}
          </p>
        ) : null}
      </footer>
    </article>
  );
}
