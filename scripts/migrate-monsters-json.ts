import { readFile } from "node:fs/promises";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { FieldValue } from "firebase-admin/firestore";

import { toSlug } from "@/lib/admin/ingest";
import {
  type MonsterWriteInput,
  monsterWriteSchema,
} from "@/lib/domain/monster.schema";

type RawMonster = Record<string, unknown>;

type SaveKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

const CREATED_BY = "monster-json-migration";
const DEFAULT_SCHEMA_VERSION = 1;
const SOURCE_FILE = path.join(process.cwd(), "data", "All Monsters.json");
const BATCH_SIZE = 400;

const SIZE_ALIASES: Record<string, MonsterWriteInput["size"]> = {
  a: "Large",
  g: "Gargantuan",
  gargantuan: "Gargantuan",
  h: "Huge",
  huge: "Huge",
  l: "Large",
  large: "Large",
  m: "Medium",
  medium: "Medium",
  s: "Small",
  small: "Small",
  t: "Tiny",
  tiny: "Tiny",
};

const SKILL_KEY_ALIASES: Record<string, string> = {
  acrobatics: "acrobatics",
  animal: "animal handling",
  arcana: "arcana",
  athletics: "athletics",
  deception: "deception",
  history: "history",
  insight: "insight",
  intimidate: "intimidation",
  intimidation: "intimidation",
  investigation: "investigation",
  medicine: "medicine",
  nature: "nature",
  perception: "perception",
  performance: "performance",
  persuasion: "persuasion",
  presuasion: "persuasion",
  religion: "religion",
  sleight: "sleight of hand",
  stealth: "stealth",
  survival: "survival",
};

const SAVE_FIELD_MAP: Record<string, SaveKey> = {
  charisma_save: "cha",
  constitution_save: "con",
  dexterity_save: "dex",
  intelligence_save: "int",
  strength_save: "str",
  wisdom_save: "wis",
};

const ABILITY_NAME_MAP: Record<string, SaveKey> = {
  cha: "cha",
  charisma: "cha",
  con: "con",
  constitution: "con",
  dex: "dex",
  dexterity: "dex",
  int: "int",
  intelligence: "int",
  str: "str",
  strength: "str",
  wis: "wis",
  wisdom: "wis",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toTrimmedString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toInt = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  const normalized = toTrimmedString(value).toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized === "l") {
    return 1;
  }

  const parsed = Number.parseInt(normalized.replace(/[^0-9-]+/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseChallengeRatingNumeric = (value: unknown): number => {
  const raw = toTrimmedString(value).toLowerCase();
  if (!raw || raw === "00") {
    return 0;
  }

  if (raw === "l") {
    return 1;
  }

  if (raw.includes("/")) {
    const [left = "", right = ""] = raw.split("/", 2);
    const numerator = Number.parseFloat(left);
    const denominator = Number.parseFloat(right);
    if (
      Number.isFinite(numerator) &&
      Number.isFinite(denominator) &&
      denominator
    ) {
      return numerator / denominator;
    }
    return 0;
  }

  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDelimitedList = (value: unknown): string[] | undefined => {
  const raw = toTrimmedString(value);
  if (!raw) {
    return undefined;
  }

  const lowered = raw.toLowerCase();
  if (["-", "—", "none", "none.", "n/a"].includes(lowered)) {
    return undefined;
  }

  const values = raw
    .split(/[;,]/)
    .map((item) => item.trim().replace(/^and\s+/i, ""))
    .filter(Boolean);

  if (!values.length) {
    return undefined;
  }

  return [...new Set(values)];
};

const parseSpellSlots = (value: unknown): number[] | undefined => {
  const parsed = parseDelimitedList(value);
  if (!parsed) {
    return undefined;
  }

  const slots = parsed
    .map((slot) => Number.parseInt(slot, 10))
    .filter((slot) => Number.isInteger(slot));

  return slots.length ? slots : undefined;
};

const normalizeSize = (
  rawSize: unknown,
  rawType: unknown
): MonsterWriteInput["size"] => {
  const size = toTrimmedString(rawSize);
  const aliased = SIZE_ALIASES[size.toLowerCase()];
  if (aliased) {
    return aliased;
  }

  const typeFirstWord = toTrimmedString(rawType)
    .split(/\s+/, 1)[0]
    ?.toLowerCase();
  if (typeFirstWord && SIZE_ALIASES[typeFirstWord]) {
    return SIZE_ALIASES[typeFirstWord];
  }

  return "Medium";
};

const parseSkills = (
  monster: RawMonster
): Record<string, number> | undefined => {
  const skills: Record<string, number> = {};

  const rawSkillText = toTrimmedString(monster.skill);
  if (rawSkillText) {
    const matches = rawSkillText.matchAll(/([^,]+?)\s*([+-]?\d+)/g);
    for (const match of matches) {
      const name = match[1]?.trim().toLowerCase();
      const value = Number.parseInt(match[2] ?? "", 10);
      if (!name || !Number.isInteger(value)) {
        continue;
      }
      skills[name] = value;
    }
  }

  for (const [rawKey, normalizedKey] of Object.entries(SKILL_KEY_ALIASES)) {
    const parsed = toInt(monster[rawKey]);
    if (parsed !== null) {
      skills[normalizedKey] = parsed;
    }
  }

  return Object.keys(skills).length ? skills : undefined;
};

const parseSavingThrows = (
  monster: RawMonster
): Record<string, number> | undefined => {
  const saves: Record<string, number> = {};

  const saveText = toTrimmedString(monster.save);
  if (saveText) {
    const matches = saveText.matchAll(/([A-Za-z]+)\s*([+-]?\d+)/g);
    for (const match of matches) {
      const rawAbility = match[1]?.trim().toLowerCase();
      const value = Number.parseInt(match[2] ?? "", 10);
      const ability = rawAbility ? ABILITY_NAME_MAP[rawAbility] : undefined;
      if (!ability || !Number.isInteger(value)) {
        continue;
      }
      saves[ability] = value;
    }
  }

  for (const [rawField, ability] of Object.entries(SAVE_FIELD_MAP)) {
    const parsed = toInt(monster[rawField]);
    if (parsed !== null) {
      saves[ability] = parsed;
    }
  }

  return Object.keys(saves).length ? saves : undefined;
};

const parseNamedTextEntries = (
  value: unknown,
  includeAttack: boolean
):
  | Array<{ attack?: string[]; name: string; text: string }>
  | Array<{ name: string; text: string }>
  | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const entries = value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const name = toTrimmedString(item.name);
      const text = toTrimmedString(item.text);
      if (!name || !text) {
        return null;
      }

      if (!includeAttack) {
        return { name, text };
      }

      const attack = Array.isArray(item.attack)
        ? item.attack.map((part) => toTrimmedString(part)).filter(Boolean)
        : undefined;

      return {
        ...(attack && attack.length ? { attack } : {}),
        name,
        text,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return entries.length ? entries : undefined;
};

const createId = (
  name: string,
  source: string,
  index: number,
  counts: Map<string, number>
): string => {
  const rawBase = toSlug(`${name}-${source}`) || `monster-${index + 1}`;
  const nextCount = (counts.get(rawBase) ?? 0) + 1;
  counts.set(rawBase, nextCount);
  return nextCount === 1 ? rawBase : `${rawBase}-${nextCount}`;
};

const toMonsterWriteInput = (
  rawMonster: RawMonster,
  index: number,
  idCounts: Map<string, number>
): MonsterWriteInput => {
  const name =
    toTrimmedString(rawMonster.name) || `Unnamed Monster ${index + 1}`;
  const source = toTrimmedString(rawMonster.source) || "unknown";
  const crText = toTrimmedString(rawMonster.cr) || "0";
  const id = createId(name, source, index, idCounts);

  const abilityScores = {
    cha: toInt(rawMonster.charisma) ?? 10,
    con: toInt(rawMonster.constitution) ?? 10,
    dex: toInt(rawMonster.dexterity) ?? 10,
    int: toInt(rawMonster.intelligence) ?? 10,
    str: toInt(rawMonster.strength) ?? 10,
    wis: toInt(rawMonster.wisdom) ?? 10,
  };

  const actions = parseNamedTextEntries(rawMonster.actions, true);
  const conditionImmunities = parseDelimitedList(rawMonster.conditionImmune);
  const damageImmunities = parseDelimitedList(rawMonster.immune);
  const damageResistances = parseDelimitedList(rawMonster.resist);
  const damageVulnerabilities = parseDelimitedList(rawMonster.vulnerable);
  const languages = parseDelimitedList(rawMonster.languages);
  const legendaryActions = parseNamedTextEntries(
    rawMonster.legendary_actions,
    false
  );
  const passivePerception = toInt(rawMonster.passive);
  const reactions = parseNamedTextEntries(rawMonster.reactions, false);
  const savingThrows = parseSavingThrows(rawMonster);
  const senses = toTrimmedString(rawMonster.senses);
  const skills = parseSkills(rawMonster);
  const specialAbilities = parseNamedTextEntries(
    rawMonster.special_abilities,
    false
  );
  const spellList = parseDelimitedList(rawMonster.spells);
  const spellSlots = parseSpellSlots(rawMonster.slots);

  const parsed = {
    abilityScores,
    alignment: toTrimmedString(rawMonster.alignment) || "unaligned",
    armorClass: toTrimmedString(rawMonster.armor_class) || "10",
    challengeRating: crText,
    createdBy: CREATED_BY,
    crNumeric: parseChallengeRatingNumeric(crText),
    hitPoints: toTrimmedString(rawMonster.hit_points) || "1",
    id,
    isPublished: true,
    name,
    nameNormalized: name.toLowerCase(),
    schemaVersion: DEFAULT_SCHEMA_VERSION,
    size: normalizeSize(rawMonster.size, rawMonster.type),
    source,
    speed: toTrimmedString(rawMonster.speed) || "30 ft.",
    type: toTrimmedString(rawMonster.type) || "unknown",
    updatedBy: CREATED_BY,
    ...(actions ? { actions } : {}),
    ...(conditionImmunities ? { conditionImmunities } : {}),
    ...(damageImmunities ? { damageImmunities } : {}),
    ...(damageResistances ? { damageResistances } : {}),
    ...(damageVulnerabilities ? { damageVulnerabilities } : {}),
    ...(languages ? { languages } : {}),
    ...(legendaryActions ? { legendaryActions } : {}),
    ...(passivePerception !== null ? { passivePerception } : {}),
    ...(reactions ? { reactions } : {}),
    ...(savingThrows ? { savingThrows } : {}),
    ...(senses ? { senses } : {}),
    ...(skills ? { skills } : {}),
    ...(specialAbilities ? { specialAbilities } : {}),
    ...(spellList ? { spellList } : {}),
    ...(spellSlots ? { spellSlots } : {}),
  };

  return monsterWriteSchema.parse(parsed);
};

type UpsertSummary = {
  created: number;
  updated: number;
};

async function upsertMonsters(
  entries: MonsterWriteInput[]
): Promise<UpsertSummary> {
  const { getAdminDb } = await import("../lib/firebase-admin");
  const { toMonsterFirestoreDoc, toMonsterUpdateDoc } =
    await import("../lib/api/firestore");

  const db = getAdminDb();
  let created = 0;
  let updated = 0;

  for (let start = 0; start < entries.length; start += BATCH_SIZE) {
    const chunk = entries.slice(start, start + BATCH_SIZE);
    const refs = chunk.map((entry) => db.collection("monsters").doc(entry.id));
    const snapshots = await db.getAll(...refs);
    const batch = db.batch();

    for (const [index, entry] of chunk.entries()) {
      const ref = refs[index];
      const snapshot = snapshots[index];
      if (!ref || !snapshot) {
        continue;
      }

      if (snapshot.exists) {
        const existingCreatedAt =
          snapshot.get("createdAt") ?? FieldValue.serverTimestamp();
        batch.set(
          ref,
          toMonsterUpdateDoc(
            entry,
            FieldValue.serverTimestamp(),
            existingCreatedAt
          )
        );
        updated += 1;
        continue;
      }

      batch.set(
        ref,
        toMonsterFirestoreDoc(entry, FieldValue.serverTimestamp())
      );
      created += 1;
    }

    await batch.commit();
    console.log(
      `Committed batch ${Math.floor(start / BATCH_SIZE) + 1} (${chunk.length} records).`
    );
  }

  return { created, updated };
}

async function main() {
  loadEnvConfig(process.cwd());

  const { getAdminDb, hasRequiredServerFirebaseConfig } =
    await import("../lib/firebase-admin");

  if (!hasRequiredServerFirebaseConfig) {
    throw new Error(
      "Missing Firestore server env. Set FIREBASE_PROJECT_ID and service credentials if required."
    );
  }

  const rawFile = await readFile(SOURCE_FILE, "utf8");
  const parsedData = JSON.parse(rawFile);
  if (!Array.isArray(parsedData)) {
    throw new Error(
      "Expected data/All Monsters.json to contain a top-level array."
    );
  }

  const idCounts = new Map<string, number>();
  const validMonsters: MonsterWriteInput[] = [];
  let skipped = 0;

  for (const [index, value] of parsedData.entries()) {
    if (!isRecord(value)) {
      skipped += 1;
      continue;
    }

    try {
      validMonsters.push(toMonsterWriteInput(value, index, idCounts));
    } catch (error) {
      skipped += 1;
      const name = toTrimmedString(value.name) || `index:${index}`;
      console.warn(
        `Skipping '${name}' due to validation/transform error.`,
        error
      );
    }
  }

  const summary = await upsertMonsters(validMonsters);

  const db = getAdminDb();
  await db
    .collection("meta")
    .doc("collections")
    .set(
      {
        monstersVersion: FieldValue.increment(
          summary.created + summary.updated
        ),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  console.log("Monster migration complete.");
  console.log({
    created: summary.created,
    skipped,
    updated: summary.updated,
    validated: validMonsters.length,
  });
}

main().catch((error: unknown) => {
  console.error("Monster migration failed.", error);
  process.exitCode = 1;
});
