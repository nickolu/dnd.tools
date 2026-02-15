import { toNameNormalized, toSlug } from "@/lib/admin/ingest";
import type { SpellWriteInput } from "@/lib/domain/spell.schema";
import {
  DEFAULT_SPELL_ADMIN_FORM,
  SPELL_SCHOOLS,
} from "@/page/admin-spells-create/constants";
import type { SpellAdminFormState } from "@/page/admin-spells-create/types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const splitByComma = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const splitByLines = (value: string): string[] =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const mapFromLines = (value: string): Record<string, string> | undefined => {
  const parsed: Record<string, string> = {};
  splitByLines(value).forEach((line) => {
    const [key, ...rest] = line.split(":");
    const parsedKey = key?.trim();
    const parsedValue = rest.join(":").trim();
    if (!parsedKey || !parsedValue) {
      return;
    }

    parsed[parsedKey] = parsedValue;
  });

  if (!Object.keys(parsed).length) {
    return undefined;
  }

  return parsed;
};

const mapToLines = (value: Record<string, string> | undefined): string =>
  value
    ? Object.entries(value)
        .map(([key, entry]) => `${key}: ${entry}`)
        .join("\n")
    : "";

const toOptionalInt = (value: string): number | undefined => {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return undefined;
  }

  return parsed;
};

const valueFromRecord = (
  record: Record<string, unknown>,
  key: string
): string => {
  const value = record[key];
  return typeof value === "string" ? value : "";
};

const booleanFromRecord = (
  record: Record<string, unknown>,
  key: string
): boolean => record[key] === true;

const arrayFromRecord = (record: Record<string, unknown>, key: string): string[] => {
  const value = record[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
};

const objectFromRecord = (
  record: Record<string, unknown>,
  key: string
): Record<string, unknown> | null => {
  const value = record[key];
  if (!isRecord(value)) {
    return null;
  }

  return value;
};

const stringMapFromUnknown = (
  value: unknown
): Record<string, string> | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string"
  );
  if (!entries.length) {
    return undefined;
  }

  return Object.fromEntries(entries);
};

const isSpellSchool = (value: string): value is SpellAdminFormState["school"] =>
  SPELL_SCHOOLS.some((school) => school === value);

const isAttackType = (value: string): value is "melee" | "ranged" =>
  value === "melee" || value === "ranged";

const isSaveAbility = (
  value: unknown
): value is NonNullable<SpellWriteInput["save"]>["ability"] =>
  value === "str" ||
  value === "dex" ||
  value === "con" ||
  value === "int" ||
  value === "wis" ||
  value === "cha";

export const toSpellPayload = (
  state: SpellAdminFormState
): SpellWriteInput | null => {
  const name = state.name.trim();
  const id = state.id.trim() || toSlug(name);
  const level = Number(state.level);
  const schemaVersion = Number(state.schemaVersion);

  if (!name || !id || !Number.isInteger(level) || !Number.isInteger(schemaVersion)) {
    return null;
  }

  const classes = splitByComma(state.classesText);
  const description = splitByLines(state.descriptionText);
  if (!classes.length || !description.length) {
    return null;
  }

  const damageDiceBySlot = mapFromLines(state.diceBySlotText);
  const cantripScaling = mapFromLines(state.cantripScalingText);
  const damage =
    state.damageType.trim() || damageDiceBySlot || cantripScaling
      ? {
          cantripScaling,
          diceBySlot: damageDiceBySlot,
          type: state.damageType.trim() || "force",
        }
      : undefined;

  const payload: SpellWriteInput = {
    castingTime: state.castingTime.trim(),
    classes,
    components: {
      material: state.componentMaterial,
      materialText:
        state.componentMaterial && state.materialText.trim()
          ? state.materialText.trim()
          : undefined,
      somatic: state.componentSomatic,
      verbal: state.componentVerbal,
    },
    concentration: state.concentration,
    createdBy: state.createdBy.trim() || state.actor.trim() || "admin-ui",
    description,
    duration: state.duration.trim(),
    id,
    isPublished: state.isPublished,
    level,
    name,
    nameNormalized: toNameNormalized(name),
    range: state.range.trim(),
    ritual: state.ritual,
    schemaVersion,
    school: state.school,
    source: state.source.trim(),
    updatedBy: state.updatedBy.trim() || state.actor.trim() || "admin-ui",
  };

  if (state.attackType) {
    payload.attackType = state.attackType;
  }

  const gpCost = toOptionalInt(state.gpCost);
  if (gpCost !== undefined) {
    payload.gpCost = gpCost;
  }

  const higherLevel = splitByLines(state.higherLevelText);
  if (higherLevel.length) {
    payload.higherLevel = higherLevel;
  }

  if (damage) {
    payload.damage = damage;
  }

  if (state.saveAbility) {
    payload.save = {
      ability: state.saveAbility,
      onSuccess: state.saveOnSuccess.trim() || undefined,
    };
  }

  const tags = splitByComma(state.tagsText);
  if (tags.length) {
    payload.tags = tags;
  }

  const searchTokens = splitByComma(state.searchTokensText);
  if (searchTokens.length) {
    payload.searchTokens = searchTokens;
  }

  return payload;
};

export const toSpellFormState = (draft: unknown): SpellAdminFormState => {
  const record = isRecord(draft) ? draft : {};

  const components = objectFromRecord(record, "components");
  const damage = objectFromRecord(record, "damage");
  const save = objectFromRecord(record, "save");
  const schoolCandidate = valueFromRecord(record, "school");
  const school = isSpellSchool(schoolCandidate)
    ? schoolCandidate
    : DEFAULT_SPELL_ADMIN_FORM.school;

  return {
    ...DEFAULT_SPELL_ADMIN_FORM,
    actor: valueFromRecord(record, "createdBy") || DEFAULT_SPELL_ADMIN_FORM.actor,
    attackType:
      (() => {
        const attackType = valueFromRecord(record, "attackType");
        return isAttackType(attackType) ? attackType : "";
      })(),
    cantripScalingText: mapToLines(
      stringMapFromUnknown(damage?.cantripScaling)
    ),
    castingTime: valueFromRecord(record, "castingTime"),
    classesText: arrayFromRecord(record, "classes").join(", "),
    componentMaterial:
      components && typeof components.material === "boolean"
        ? components.material
        : false,
    componentSomatic:
      components && typeof components.somatic === "boolean"
        ? components.somatic
        : false,
    componentVerbal:
      components && typeof components.verbal === "boolean"
        ? components.verbal
        : false,
    concentration: booleanFromRecord(record, "concentration"),
    createdBy:
      valueFromRecord(record, "createdBy") || DEFAULT_SPELL_ADMIN_FORM.createdBy,
    damageType:
      damage && typeof damage.type === "string" ? damage.type : "",
    descriptionText: arrayFromRecord(record, "description").join("\n"),
    diceBySlotText: mapToLines(
      stringMapFromUnknown(damage?.diceBySlot)
    ),
    duration: valueFromRecord(record, "duration"),
    gpCost:
      typeof record.gpCost === "number" && Number.isFinite(record.gpCost)
        ? String(record.gpCost)
        : "",
    higherLevelText: arrayFromRecord(record, "higherLevel").join("\n"),
    id: valueFromRecord(record, "id"),
    isPublished: booleanFromRecord(record, "isPublished"),
    level:
      typeof record.level === "number" && Number.isFinite(record.level)
        ? String(record.level)
        : DEFAULT_SPELL_ADMIN_FORM.level,
    materialText:
      components && typeof components.materialText === "string"
        ? components.materialText
        : "",
    name: valueFromRecord(record, "name"),
    range: valueFromRecord(record, "range"),
    ritual: booleanFromRecord(record, "ritual"),
    saveAbility:
      isSaveAbility(save?.ability) ? save.ability : "",
    saveOnSuccess: save && typeof save.onSuccess === "string" ? save.onSuccess : "",
    schemaVersion:
      typeof record.schemaVersion === "number" &&
      Number.isFinite(record.schemaVersion)
        ? String(record.schemaVersion)
        : DEFAULT_SPELL_ADMIN_FORM.schemaVersion,
    school,
    searchTokensText: arrayFromRecord(record, "searchTokens").join(", "),
    source: valueFromRecord(record, "source") || DEFAULT_SPELL_ADMIN_FORM.source,
    tagsText: arrayFromRecord(record, "tags").join(", "),
    updatedBy:
      valueFromRecord(record, "updatedBy") || DEFAULT_SPELL_ADMIN_FORM.updatedBy,
  };
};
