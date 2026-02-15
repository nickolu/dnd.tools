import { z } from "zod";

import { toNameNormalized, toSlug } from "@/lib/admin/ingest";
import type { MonsterWriteInput } from "@/lib/domain/monster.schema";
import {
  DEFAULT_MONSTER_ADMIN_FORM,
  MONSTER_SIZES,
} from "@/page/admin-monsters-create/constants";
import type { MonsterAdminFormState } from "@/page/admin-monsters-create/types";

type MonsterNamedText = {
  name: string;
  text: string;
};

type MonsterActionText = MonsterNamedText & {
  attack?: string[] | undefined;
};

const monsterNamedTextSchema = z.object({
  name: z.string().min(1),
  text: z.string().min(1),
});

const monsterActionTextSchema = monsterNamedTextSchema.extend({
  attack: z.array(z.string()).optional(),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const splitByComma = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const splitNumbersByComma = (value: string): number[] =>
  splitByComma(value)
    .map((entry) => Number(entry))
    .filter((entry) => Number.isInteger(entry));

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

const toRequiredInt = (value: string): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
};

const toRequiredNumber = (value: string): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
};

const mapFromLines = (value: string): Record<string, number> | undefined => {
  const parsed: Record<string, number> = {};
  const entries = value
    .split("\n")
    .flatMap((line) => line.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);

  entries.forEach((entry) => {
    const colonMatch = entry.match(/^(.+?):\s*([+-]?\d+)$/);
    if (colonMatch) {
      const key = colonMatch[1]?.trim();
      const parsedValue = Number(colonMatch[2]);
      if (key && Number.isInteger(parsedValue)) {
        parsed[key] = parsedValue;
      }
      return;
    }

    const signedMatch = entry.match(/^(.+?)\s+([+-]\d+)$/);
    if (signedMatch) {
      const key = signedMatch[1]?.trim();
      const parsedValue = Number(signedMatch[2]);
      if (key && Number.isInteger(parsedValue)) {
        parsed[key] = parsedValue;
      }
    }
  });

  if (!Object.keys(parsed).length) {
    return undefined;
  }

  return parsed;
};

const mapToLines = (value: Record<string, number> | undefined): string =>
  value
    ? Object.entries(value)
        .map(([key, entry]) => `${key}: ${entry}`)
        .join("\n")
    : "";

const parseOptionalJsonArray = <T>(
  value: string,
  schema: z.ZodType<T>
): T[] | undefined => {
  if (!value.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    const validated = z.array(schema).safeParse(parsed);
    return validated.success ? validated.data : undefined;
  } catch {
    return undefined;
  }
};

const toJsonString = (value: unknown): string =>
  Array.isArray(value) && value.length ? JSON.stringify(value, null, 2) : "";

const stringFromRecord = (
  record: Record<string, unknown>,
  key: string
): string => {
  const value = record[key];
  return typeof value === "string" ? value : "";
};

const boolFromRecord = (
  record: Record<string, unknown>,
  key: string
): boolean => record[key] === true;

const arrayFromRecord = (
  record: Record<string, unknown>,
  key: string
): string[] => {
  const value = record[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
};

const numberFromRecord = (
  record: Record<string, unknown>,
  key: string
): number | null => {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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

const isMonsterSize = (value: string): value is MonsterAdminFormState["size"] =>
  MONSTER_SIZES.some((size) => size === value);

const numberArrayFromRecord = (
  record: Record<string, unknown>,
  key: string
): number[] => {
  const value = record[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is number =>
      typeof entry === "number" && Number.isFinite(entry)
  );
};

export const toMonsterPayload = (
  state: MonsterAdminFormState
): MonsterWriteInput | null => {
  const name = state.name.trim();
  const id = state.id.trim() || toSlug(name);
  const schemaVersion = toRequiredInt(state.schemaVersion);
  const crNumeric = toRequiredNumber(state.crNumeric);

  const str = toRequiredInt(state.abilityStr);
  const dex = toRequiredInt(state.abilityDex);
  const con = toRequiredInt(state.abilityCon);
  const int = toRequiredInt(state.abilityInt);
  const wis = toRequiredInt(state.abilityWis);
  const cha = toRequiredInt(state.abilityCha);

  if (
    !name ||
    !id ||
    schemaVersion === null ||
    crNumeric === null ||
    str === null ||
    dex === null ||
    con === null ||
    int === null ||
    wis === null ||
    cha === null ||
    !state.type.trim() ||
    !state.alignment.trim() ||
    !state.armorClass.trim() ||
    !state.hitPoints.trim() ||
    !state.speed.trim() ||
    !state.challengeRating.trim() ||
    !state.source.trim()
  ) {
    return null;
  }

  const payload: MonsterWriteInput = {
    abilityScores: { cha, con, dex, int, str, wis },
    alignment: state.alignment.trim(),
    armorClass: state.armorClass.trim(),
    challengeRating: state.challengeRating.trim(),
    crNumeric,
    createdBy: state.createdBy.trim() || state.actor.trim() || "admin-ui",
    hitPoints: state.hitPoints.trim(),
    id,
    isPublished: state.isPublished,
    name,
    nameNormalized: toNameNormalized(name),
    schemaVersion,
    size: state.size,
    source: state.source.trim(),
    speed: state.speed.trim(),
    type: state.type.trim(),
    updatedBy: state.updatedBy.trim() || state.actor.trim() || "admin-ui",
  };

  const passivePerception = toOptionalInt(state.passivePerception);
  if (passivePerception !== undefined) {
    payload.passivePerception = passivePerception;
  }

  const proficiencyBonus = toOptionalInt(state.proficiencyBonus);
  if (proficiencyBonus !== undefined) {
    payload.proficiencyBonus = proficiencyBonus;
  }

  const languages = splitByComma(state.languagesText);
  if (languages.length) {
    payload.languages = languages;
  }

  if (state.senses.trim()) {
    payload.senses = state.senses.trim();
  }

  const damageImmunities = splitByComma(state.damageImmunitiesText);
  if (damageImmunities.length) {
    payload.damageImmunities = damageImmunities;
  }

  const damageResistances = splitByComma(state.damageResistancesText);
  if (damageResistances.length) {
    payload.damageResistances = damageResistances;
  }

  const damageVulnerabilities = splitByComma(state.damageVulnerabilitiesText);
  if (damageVulnerabilities.length) {
    payload.damageVulnerabilities = damageVulnerabilities;
  }

  const conditionImmunities = splitByComma(state.conditionImmunitiesText);
  if (conditionImmunities.length) {
    payload.conditionImmunities = conditionImmunities;
  }

  const savingThrows = mapFromLines(state.savingThrowsText);
  if (savingThrows) {
    payload.savingThrows = savingThrows;
  }

  const skills = mapFromLines(state.skillsText);
  if (skills) {
    payload.skills = skills;
  }

  const spellList = splitByComma(state.spellListText);
  if (spellList.length) {
    payload.spellList = spellList;
  }

  const spellSlots = splitNumbersByComma(state.spellSlotsText);
  if (spellSlots.length) {
    payload.spellSlots = spellSlots;
  }

  const specialAbilities = parseOptionalJsonArray<MonsterNamedText>(
    state.specialAbilitiesJson,
    monsterNamedTextSchema
  );
  if (specialAbilities?.length) {
    payload.specialAbilities = specialAbilities;
  }

  const actions = parseOptionalJsonArray<MonsterActionText>(
    state.actionsJson,
    monsterActionTextSchema
  );
  if (actions?.length) {
    payload.actions = actions;
  }

  const reactions = parseOptionalJsonArray<MonsterNamedText>(
    state.reactionsJson,
    monsterNamedTextSchema
  );
  if (reactions?.length) {
    payload.reactions = reactions;
  }

  const legendaryActions = parseOptionalJsonArray<MonsterNamedText>(
    state.legendaryActionsJson,
    monsterNamedTextSchema
  );
  if (legendaryActions?.length) {
    payload.legendaryActions = legendaryActions;
  }

  const searchTokens = splitByComma(state.searchTokensText);
  if (searchTokens.length) {
    payload.searchTokens = searchTokens;
  }

  return payload;
};

export const toMonsterFormState = (draft: unknown): MonsterAdminFormState => {
  const record = isRecord(draft) ? draft : {};
  const abilities = objectFromRecord(record, "abilityScores");
  const savingThrows = objectFromRecord(record, "savingThrows");
  const skills = objectFromRecord(record, "skills");
  const sizeCandidate = stringFromRecord(record, "size");
  const size = isMonsterSize(sizeCandidate)
    ? sizeCandidate
    : DEFAULT_MONSTER_ADMIN_FORM.size;

  return {
    ...DEFAULT_MONSTER_ADMIN_FORM,
    abilityCha:
      abilities && typeof abilities.cha === "number"
        ? String(abilities.cha)
        : "10",
    abilityCon:
      abilities && typeof abilities.con === "number"
        ? String(abilities.con)
        : "10",
    abilityDex:
      abilities && typeof abilities.dex === "number"
        ? String(abilities.dex)
        : "10",
    abilityInt:
      abilities && typeof abilities.int === "number"
        ? String(abilities.int)
        : "10",
    abilityStr:
      abilities && typeof abilities.str === "number"
        ? String(abilities.str)
        : "10",
    abilityWis:
      abilities && typeof abilities.wis === "number"
        ? String(abilities.wis)
        : "10",
    actionsJson: toJsonString(record.actions),
    actor:
      stringFromRecord(record, "createdBy") || DEFAULT_MONSTER_ADMIN_FORM.actor,
    alignment: stringFromRecord(record, "alignment"),
    armorClass: stringFromRecord(record, "armorClass"),
    challengeRating: stringFromRecord(record, "challengeRating"),
    conditionImmunitiesText: arrayFromRecord(
      record,
      "conditionImmunities"
    ).join(", "),
    createdBy:
      stringFromRecord(record, "createdBy") ||
      DEFAULT_MONSTER_ADMIN_FORM.createdBy,
    crNumeric:
      numberFromRecord(record, "crNumeric") !== null
        ? String(numberFromRecord(record, "crNumeric"))
        : "",
    damageImmunitiesText: arrayFromRecord(record, "damageImmunities").join(
      ", "
    ),
    damageResistancesText: arrayFromRecord(record, "damageResistances").join(
      ", "
    ),
    damageVulnerabilitiesText: arrayFromRecord(
      record,
      "damageVulnerabilities"
    ).join(", "),
    hitPoints: stringFromRecord(record, "hitPoints"),
    id: stringFromRecord(record, "id"),
    isPublished: boolFromRecord(record, "isPublished"),
    languagesText: arrayFromRecord(record, "languages").join(", "),
    legendaryActionsJson: toJsonString(record.legendaryActions),
    name: stringFromRecord(record, "name"),
    passivePerception:
      numberFromRecord(record, "passivePerception") !== null
        ? String(numberFromRecord(record, "passivePerception"))
        : "",
    proficiencyBonus:
      numberFromRecord(record, "proficiencyBonus") !== null
        ? String(numberFromRecord(record, "proficiencyBonus"))
        : "",
    reactionsJson: toJsonString(record.reactions),
    savingThrowsText: mapToLines(
      savingThrows
        ? Object.fromEntries(
            Object.entries(savingThrows).filter(
              (entry): entry is [string, number] =>
                typeof entry[1] === "number" && Number.isFinite(entry[1])
            )
          )
        : undefined
    ),
    schemaVersion:
      numberFromRecord(record, "schemaVersion") !== null
        ? String(numberFromRecord(record, "schemaVersion"))
        : DEFAULT_MONSTER_ADMIN_FORM.schemaVersion,
    searchTokensText: arrayFromRecord(record, "searchTokens").join(", "),
    senses: stringFromRecord(record, "senses"),
    size,
    skillsText: mapToLines(
      skills
        ? Object.fromEntries(
            Object.entries(skills).filter(
              (entry): entry is [string, number] =>
                typeof entry[1] === "number" && Number.isFinite(entry[1])
            )
          )
        : undefined
    ),
    source:
      stringFromRecord(record, "source") || DEFAULT_MONSTER_ADMIN_FORM.source,
    specialAbilitiesJson: toJsonString(record.specialAbilities),
    speed: stringFromRecord(record, "speed"),
    spellListText: arrayFromRecord(record, "spellList").join(", "),
    spellSlotsText: numberArrayFromRecord(record, "spellSlots").join(", "),
    type: stringFromRecord(record, "type"),
    updatedBy:
      stringFromRecord(record, "updatedBy") ||
      DEFAULT_MONSTER_ADMIN_FORM.updatedBy,
  };
};
