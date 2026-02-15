import { readFile } from "node:fs/promises";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { FieldValue } from "firebase-admin/firestore";

import { toNameNormalized, toSlug } from "@/lib/admin/ingest";
import {
  type SpellWriteInput,
  spellWriteSchema,
} from "@/lib/domain/spell.schema";

type RawSpell = Record<string, unknown>;

type RankedSpell = {
  score: number;
  spell: SpellWriteInput;
};

const CREATED_BY = "spell-json-migration";
const DEFAULT_SCHEMA_VERSION = 1;
const SOURCE_FILE = path.join(process.cwd(), "data", "spells.json");
const BATCH_SIZE = 400;
const WOTC_PUBLISHER = "wizards of the coast";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toTrimmedString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeText = (value: string): string =>
  value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&ndash;/gi, "-")
    .replace(/&mdash;/gi, "-")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const normalizeHeaderTypos = (value: string): string =>
  value
    .replace(/\bRang\s*e\b/gi, "Range")
    .replace(/\bCom\s*ponents?\b/gi, "Components")
    .replace(/\bDur\s*ation\b/gi, "Duration")
    .replace(/\bCast\s*ing\s*Time\b/gi, "Casting Time");

const KNOWN_CLASSES = new Set([
  "artificer",
  "bard",
  "cleric",
  "druid",
  "paladin",
  "ranger",
  "sorcerer",
  "warlock",
  "wizard",
]);

const splitCsv = (value: string): string[] =>
  value
    .split(/[;,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const compactDigitSpacing = (value: string): string => {
  let next = value;
  let prev = "";

  while (next !== prev) {
    prev = next;
    next = next.replace(/(\d)\s+(\d)/g, "$1$2");
  }

  return next;
};

const formatCountWithUnit = (rawCount: string, rawUnit: string): string => {
  const numeric = Number.parseInt(rawCount.replace(/[^0-9]/g, ""), 10);
  const count = Number.isFinite(numeric)
    ? numeric.toLocaleString("en-US")
    : rawCount.trim();
  const unitBase = rawUnit.toLowerCase().replace(/s$/, "");
  const unit = count === "1" ? unitBase : `${unitBase}s`;
  return `${count} ${unit}`;
};

const toOptionalInt = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  const raw = toTrimmedString(value);
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw.replace(/[^0-9-]+/g, ""), 10);
  return Number.isInteger(parsed) ? parsed : null;
};

const parseSchool = (value: unknown): SpellWriteInput["school"] | null => {
  const normalized =
    toTrimmedString(value)
      .toLowerCase()
      .replace(/\([^)]*\)/g, "")
      .trim()
      .split(/\s+/, 1)[0] ?? "";

  switch (normalized) {
    case "abjuration":
    case "conjuration":
    case "divination":
    case "enchantment":
    case "evocation":
    case "illusion":
    case "necromancy":
    case "transmutation":
      return normalized;
    default:
      return null;
  }
};

const parseAbility = (
  value: unknown
): NonNullable<SpellWriteInput["save"]>["ability"] | null => {
  const normalized = toTrimmedString(value).toLowerCase();

  switch (normalized) {
    case "strength":
    case "str":
      return "str";
    case "dexterity":
    case "dex":
      return "dex";
    case "constitution":
    case "con":
      return "con";
    case "intelligence":
    case "int":
      return "int";
    case "wisdom":
    case "wis":
      return "wis";
    case "charisma":
    case "cha":
      return "cha";
    default:
      return null;
  }
};

const parseBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = toTrimmedString(value).toLowerCase();
  if (!normalized) {
    return null;
  }

  if (["1", "true", "yes", "y"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "n"].includes(normalized)) {
    return false;
  }

  return null;
};

const splitParagraphs = (value: string): string[] =>
  normalizeText(value)
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const extractFromLabeledText = (value: string, label: string): string => {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const normalized = normalizeHeaderTypos(normalizeText(value));
  const match = normalized.match(
    new RegExp(`${escaped}\\s*:\\s*([^\\n]+)`, "i")
  );
  return match?.[1]?.trim() ?? "";
};

const normalizeSpellRange = (value: string): string => {
  const trimmed = compactDigitSpacing(value.trim());
  if (!trimmed) {
    return "";
  }

  const [primary = trimmed] = trimmed.split(/\s*\(/, 1);
  const normalized = primary.trim().toLowerCase();

  if (normalized === "self") {
    return "Self";
  }
  if (normalized === "touch") {
    return "Touch";
  }
  if (normalized === "sight") {
    return "Sight";
  }
  if (normalized === "special") {
    return "Special";
  }
  if (normalized === "unlimited") {
    return "Unlimited";
  }

  const distanceMatch = normalized.match(
    /^([\d,\s]+)\s*(ft|feet|foot|foots|mile|miles)$/i
  );
  if (distanceMatch) {
    const count = distanceMatch[1] ?? "";
    const unit = distanceMatch[2] ?? "";
    const canonicalUnit = unit.toLowerCase().startsWith("mile")
      ? "mile"
      : "foot";
    return formatCountWithUnit(count, canonicalUnit);
  }

  return primary.trim().replace(/\s+/g, " ");
};

const normalizeForDuplicationCheck = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const collapseDuplicatedParagraph = (value: string): string => {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return "";
  }

  const words = trimmed.split(" ");
  if (words.length < 8) {
    return trimmed;
  }

  const midpoint = Math.floor(words.length / 2);
  if (midpoint * 2 !== words.length) {
    return trimmed;
  }

  const leftWords = words.slice(0, midpoint);
  const rightWords = words.slice(midpoint);
  const leftNormalized = normalizeForDuplicationCheck(leftWords.join(" "));
  const rightNormalized = normalizeForDuplicationCheck(rightWords.join(" "));

  if (leftNormalized && leftNormalized === rightNormalized) {
    return leftWords.join(" ");
  }

  return trimmed;
};

const normalizeSpellCastingTime = (value: string): string => {
  let normalized = normalizeHeaderTypos(value).trim();
  if (!normalized) {
    return "";
  }

  normalized = compactDigitSpacing(normalized);
  normalized = normalized.replace(/\s*\([^)]*\)/g, "").trim();
  normalized = normalized.replace(
    /[;,]\s*(?:which you take|taken when|when )[\s\S]*$/i,
    ""
  );
  normalized = normalized.replace(/\s+/g, " ");

  const toCanonicalActionToken = (token: string): string => {
    const next = token.trim().toLowerCase();
    if (next === "action") {
      return "1 action";
    }
    if (next === "bonus action") {
      return "1 bonus action";
    }
    if (next === "reaction") {
      return "1 reaction";
    }

    const durationMatch = next.match(
      /^(\d+)\s*(hour|hours|minute|minutes|minure)$/i
    );
    if (durationMatch) {
      return formatCountWithUnit(
        durationMatch[1] ?? "",
        durationMatch[2] ?? ""
      );
    }

    return next;
  };

  const parts = normalized
    .split(/\s+or\s+/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) =>
      part.toLowerCase() === "ritual" ? "ritual" : toCanonicalActionToken(part)
    );

  return parts.join(" or ");
};

const normalizeSpellDuration = (value: string): string => {
  const normalized = compactDigitSpacing(
    normalizeHeaderTypos(value)
      .replace(/\bminure\b/gi, "minute")
      .trim()
  );
  if (!normalized) {
    return "";
  }

  const withoutConcentrationPrefix = normalized
    .replace(/^concentration[, ]+/i, "")
    .replace(/^up to\s+/i, "")
    .trim();

  if (/^instantaneous\b/i.test(withoutConcentrationPrefix)) {
    return "Instantaneous";
  }
  if (/^special\b/i.test(withoutConcentrationPrefix)) {
    return "Special";
  }
  if (/^until dispelled\b/i.test(withoutConcentrationPrefix)) {
    return "Until dispelled";
  }

  const unitMatch = withoutConcentrationPrefix.match(
    /(\d[\d,\s]*)\s*(round|rounds|minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)\b/i
  );
  if (unitMatch) {
    return formatCountWithUnit(unitMatch[1] ?? "", unitMatch[2] ?? "");
  }

  return withoutConcentrationPrefix;
};

type HeaderFieldKey = "castingTime" | "components" | "duration" | "range";

const HEADER_LABELS: Array<{ key: HeaderFieldKey; pattern: RegExp }> = [
  { key: "castingTime", pattern: /\bCasting Time\b\s*:/gi },
  { key: "range", pattern: /\bRange\b\s*:/gi },
  { key: "components", pattern: /\bComponents?\b\s*:/gi },
  { key: "duration", pattern: /\bDuration\b\s*:/gi },
];

const extractHeaderFields = (
  value: string
): Partial<Record<HeaderFieldKey, string>> => {
  const normalized = normalizeHeaderTypos(normalizeText(value));
  const markers: Array<{ end: number; index: number; key: HeaderFieldKey }> =
    [];

  for (const { key, pattern } of HEADER_LABELS) {
    const match = pattern.exec(normalized);
    pattern.lastIndex = 0;
    if (!match) {
      continue;
    }

    markers.push({
      end: match.index + match[0].length,
      index: match.index,
      key,
    });
  }

  markers.sort((a, b) => a.index - b.index);
  const fields: Partial<Record<HeaderFieldKey, string>> = {};

  for (const [index, marker] of markers.entries()) {
    const next = markers[index + 1];
    const raw = normalized.slice(marker.end, next?.index).trim();
    if (!raw) {
      continue;
    }
    fields[marker.key] = raw;
  }

  return fields;
};

const cleanRangeValue = (value: string): string => {
  const [beforeComponents = ""] = value.split(/\bComponents?\b\s*:/i);
  const [beforeDuration = ""] = beforeComponents.split(/\bDuration\b\s*:/i);
  return beforeDuration.trim();
};

const cleanComponentsValue = (value: string): string => {
  const [beforeDuration = ""] = value.split(/\bDuration\b\s*:/i);
  return beforeDuration.trim();
};

const splitDurationAndDescriptionLead = (
  value: string
): { descriptionLead: string; duration: string } => {
  const normalized = value.trim();
  if (!normalized) {
    return { descriptionLead: "", duration: "" };
  }

  const durationPrefixPattern =
    /^(?:Concentration,\s*)?(?:up to\s*)?(?:Instantaneous|Special|Until dispelled|Permanent|\d+\s*(?:rounds|round|minutes|minute|hours|hour|days|day|weeks|week|months|month|years|year))(?:\s*\([^)]*\))?(?:,\s*up to\s*\d+\s*(?:rounds|round|minutes|minute|hours|hour|days|day))?/i;
  const match = normalized.match(durationPrefixPattern);
  if (!match) {
    return { descriptionLead: "", duration: normalized };
  }

  const duration = match[0]?.trim() ?? normalized;
  const descriptionLead = normalized.slice(duration.length).trim();
  return { descriptionLead, duration };
};

const stripInlineStatBlockPrefix = (value: string): string => {
  const paragraph = normalizeHeaderTypos(value).trim();
  if (
    !/\bCasting Time\b\s*:/i.test(paragraph) ||
    !/\bRange\b\s*:/i.test(paragraph) ||
    !/\bDuration\b\s*:/i.test(paragraph)
  ) {
    return value.trim();
  }

  const fields = extractHeaderFields(paragraph);
  const durationField = fields.duration ?? "";
  const extracted =
    splitDurationAndDescriptionLead(durationField).descriptionLead;
  return extracted || value.trim();
};

const dedupeParagraphs = (paragraphs: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const paragraph of paragraphs) {
    const collapsed = collapseDuplicatedParagraph(paragraph);
    const collapsedNormalized = collapsed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

    if (!collapsedNormalized || seen.has(collapsedNormalized)) {
      continue;
    }
    seen.add(collapsedNormalized);
    result.push(collapsed);
  }

  return result;
};

const parseClassesFromTextHeader = (value: string): string[] => {
  const normalized = normalizeHeaderTypos(value);
  const match = normalized.match(
    /(?:^|\n)(?:\d+(?:st|nd|rd|th)-Level|Level\s+\d+)\s+[A-Za-z]+\s*\(([^)]+)\)/i
  );
  const classesText = match?.[1] ?? "";
  if (!classesText) {
    return [];
  }

  return splitCsv(classesText)
    .map((entry) => entry.toLowerCase())
    .filter((entry) => KNOWN_CLASSES.has(entry));
};

const parseComponentText = (value: string): SpellWriteInput["components"] => {
  const normalized = value.toUpperCase();
  const materialTextMatch = value.match(/\(([^)]+)\)/);
  const materialText = materialTextMatch?.[1]?.trim();

  return {
    material: /\bM\b/.test(normalized),
    somatic: /\bS\b/.test(normalized),
    verbal: /\bV\b/.test(normalized),
    ...(materialText ? { materialText } : {}),
  };
};

const parseDataRecordPayload = (
  properties: Record<string, unknown>,
  name: string
): Record<string, unknown> | null => {
  const rawRecords = properties["data-datarecords"];
  if (typeof rawRecords !== "string") {
    return null;
  }

  try {
    const parsedRecords = JSON.parse(rawRecords);
    if (!Array.isArray(parsedRecords)) {
      return null;
    }

    const preferredRecord = parsedRecords.find((record) => {
      if (!isRecord(record)) {
        return false;
      }

      const recordName = toTrimmedString(record.name);
      return recordName && recordName.toLowerCase() === name.toLowerCase();
    });

    const candidate = isRecord(preferredRecord)
      ? preferredRecord
      : parsedRecords.find(isRecord);
    if (!candidate) {
      return null;
    }

    const payload = candidate.payload;
    if (typeof payload !== "string") {
      return null;
    }

    const parsedPayload = JSON.parse(payload);
    return isRecord(parsedPayload) ? parsedPayload : null;
  } catch {
    return null;
  }
};

const is2024Source = (value: string): boolean => /\(2024\)/i.test(value);

const strip2024Suffix = (value: string): string =>
  value.replace(/\s*\(2024\)\s*$/i, "").trim();

const with2024Suffix = (value: string): string => {
  const base = strip2024Suffix(value);
  return base ? `${base} (2024)` : value;
};

const toSpellId = (name: string, source: string): string => {
  const normalizedName = strip2024Suffix(name);
  const base = toSlug(normalizedName);
  return `${base}${is2024Source(source) ? "-2024" : ""}`;
};

const cleanClasses = (value: string[] | string): string[] => {
  const entries = Array.isArray(value) ? value : splitCsv(value);

  return [
    ...new Set(
      entries
        .map((entry) =>
          entry
            .trim()
            .toLowerCase()
            .replace(/^and\s+/i, "")
        )
        .map((entry) => entry.replace(/\.$/, ""))
        .filter(Boolean)
    ),
  ];
};

const sourceRank = (source: string): number => {
  const normalized = source.toLowerCase();
  if (normalized === "player's handbook (2024)") {
    return 120;
  }
  if (normalized === "free basic rules (2024)") {
    return 110;
  }
  if (normalized === "player's handbook") {
    return 100;
  }
  if (normalized === "free basic rules (2014)") {
    return 90;
  }
  if (normalized.includes("deprecated")) {
    return 1;
  }
  return 50;
};

const scoreSpell = (spell: SpellWriteInput): number => {
  const base =
    spell.description.join(" ").length +
    spell.classes.length * 30 +
    sourceRank(spell.source);

  return (
    base +
    (spell.higherLevel?.join(" ").length ?? 0) +
    (spell.components.materialText ? 20 : 0) +
    (spell.attackType ? 20 : 0) +
    (spell.save ? 25 : 0) +
    (spell.damage ? 30 : 0)
  );
};

const toSpellWriteInput = (
  rawSpell: RawSpell,
  index: number
): SpellWriteInput | null => {
  const publisher = toTrimmedString(rawSpell.publisher);
  if (publisher.toLowerCase() !== WOTC_PUBLISHER) {
    return null;
  }

  const nameRaw =
    toTrimmedString(rawSpell.name) || `Unnamed Spell ${index + 1}`;
  const source = toTrimmedString(rawSpell.book) || "Unknown Source";
  const sourceIs2024 = is2024Source(source);
  const name = sourceIs2024
    ? with2024Suffix(nameRaw)
    : strip2024Suffix(nameRaw);
  const id = toSpellId(name, source);

  if (!id) {
    return null;
  }

  const properties = isRecord(rawSpell.properties) ? rawSpell.properties : {};
  const payload = parseDataRecordPayload(properties, nameRaw);

  const rawDescription =
    toTrimmedString(payload?.description) ||
    toTrimmedString(properties["data-description"]) ||
    toTrimmedString(rawSpell.description);
  const headerFields = extractHeaderFields(rawDescription);

  const higherLevelText =
    toTrimmedString(properties["Higher Spell Slot Desc"]) ||
    toTrimmedString(payload?.upcastText);

  const higherLevelMatch = rawDescription.match(
    /\b(At Higher Levels?\.?|Using a Higher-Level Spell Slot\.?)\s*([\s\S]+)$/i
  );

  const descriptionText = higherLevelMatch
    ? rawDescription.replace(higherLevelMatch[0], "").trim()
    : rawDescription;

  const description = splitParagraphs(descriptionText);
  const higherLevel = splitParagraphs(
    higherLevelText || higherLevelMatch?.[2] || ""
  );

  const castingTimeRaw =
    toTrimmedString(payload?.castingTime) ||
    toTrimmedString(properties["Casting Time"]) ||
    toTrimmedString(headerFields.castingTime) ||
    extractFromLabeledText(rawDescription, "Casting Time") ||
    "1 action";
  const castingTime = normalizeSpellCastingTime(castingTimeRaw) || "1 action";

  const rangeRaw =
    toTrimmedString(payload?.range) ||
    toTrimmedString(properties.Range) ||
    toTrimmedString(properties["data-RangeAoe"]) ||
    toTrimmedString(headerFields.range) ||
    extractFromLabeledText(rawDescription, "Range") ||
    "Self";
  const range = normalizeSpellRange(cleanRangeValue(rangeRaw)) || "Self";

  const durationRaw =
    toTrimmedString(payload?.duration) ||
    toTrimmedString(properties.Duration) ||
    toTrimmedString(headerFields.duration) ||
    extractFromLabeledText(rawDescription, "Duration") ||
    "Instantaneous";
  const { descriptionLead, duration: splitDuration } =
    splitDurationAndDescriptionLead(durationRaw);
  const duration =
    normalizeSpellDuration(splitDuration || durationRaw) || "Instantaneous";

  const school =
    parseSchool(payload?.school) ??
    parseSchool(properties.School) ??
    parseSchool(extractFromLabeledText(rawDescription, "School")) ??
    null;

  const level =
    toOptionalInt(payload?.level) ??
    toOptionalInt(properties.Level) ??
    toOptionalInt(extractFromLabeledText(rawDescription, "Level"));

  if (school === null || level === null || level < 0 || level > 9) {
    return null;
  }

  const componentsFromPayload = isRecord(payload?.components)
    ? payload.components
    : null;

  const componentsText =
    toTrimmedString(properties.Components) ||
    toTrimmedString(headerFields.components) ||
    extractFromLabeledText(rawDescription, "Components");
  const cleanComponentsText = cleanComponentsValue(componentsText);

  const componentsMaterialText = componentsFromPayload
    ? toTrimmedString(componentsFromPayload.materialText)
    : "";
  const components: SpellWriteInput["components"] = componentsFromPayload
    ? {
        material: componentsFromPayload.material === true,
        somatic: componentsFromPayload.somatic === true,
        verbal: componentsFromPayload.verbal === true,
        ...(componentsMaterialText
          ? { materialText: componentsMaterialText }
          : {}),
      }
    : parseComponentText(cleanComponentsText);

  const classesRaw =
    payload?.classes ??
    properties.Classes ??
    properties["data-List"] ??
    parseClassesFromTextHeader(rawDescription);
  const classes =
    typeof classesRaw === "string" || Array.isArray(classesRaw)
      ? cleanClasses(classesRaw)
      : [];

  const concentration =
    parseBoolean(payload?.concentration) ??
    parseBoolean(properties.Concentration) ??
    (/\bconcentration\b/i.test(durationRaw) ||
      /\bconcentration\b/i.test(rawDescription));

  const ritual =
    parseBoolean(payload?.ritual) ??
    parseBoolean(properties["filter-Ritual"]) ??
    /\britual\b/i.test(rawDescription);

  const saveAbility = parseAbility(properties.Save);
  const save = saveAbility ? { ability: saveAbility } : undefined;

  const attackTypeRaw = toTrimmedString(
    properties["Spell Attack"]
  ).toLowerCase();
  const attackType = attackTypeRaw.includes("melee")
    ? "melee"
    : attackTypeRaw.includes("ranged")
      ? "ranged"
      : undefined;

  const damageType = toTrimmedString(properties["Damage Type"]).toLowerCase();
  const damage = damageType ? { type: damageType } : undefined;

  const mergedDescription = dedupeParagraphs(
    splitParagraphs([descriptionLead, ...description].join("\n\n")).map(
      (paragraph) => stripInlineStatBlockPrefix(paragraph)
    )
  );

  const parsed = {
    castingTime,
    classes,
    components,
    concentration,
    createdBy: CREATED_BY,
    description: mergedDescription.length
      ? mergedDescription
      : ["Spell description unavailable."],
    duration,
    id,
    isPublished: true,
    level,
    name,
    nameNormalized: toNameNormalized(name),
    range,
    ritual,
    schemaVersion: DEFAULT_SCHEMA_VERSION,
    school,
    source,
    updatedBy: CREATED_BY,
    ...(attackType ? { attackType } : {}),
    ...(damage ? { damage } : {}),
    ...(higherLevel.length ? { higherLevel } : {}),
    ...(publisher ? { publisher } : {}),
    ...(save ? { save } : {}),
  };

  const validated = spellWriteSchema.safeParse(parsed);
  return validated.success ? validated.data : null;
};

type UpsertSummary = {
  created: number;
  updated: number;
};

async function upsertSpells(
  entries: SpellWriteInput[]
): Promise<UpsertSummary> {
  const { getAdminDb } = await import("../lib/firebase-admin");
  const { toSpellFirestoreDoc, toSpellUpdateDoc } =
    await import("../lib/api/firestore");

  const db = getAdminDb();
  let created = 0;
  let updated = 0;

  for (let start = 0; start < entries.length; start += BATCH_SIZE) {
    const chunk = entries.slice(start, start + BATCH_SIZE);
    const refs = chunk.map((entry) => db.collection("spells").doc(entry.id));
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
          toSpellUpdateDoc(
            entry,
            FieldValue.serverTimestamp(),
            existingCreatedAt
          )
        );
        updated += 1;
        continue;
      }

      batch.set(ref, toSpellFirestoreDoc(entry, FieldValue.serverTimestamp()));
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

  const dryRun = process.argv.includes("--dry-run");
  const limitArgIndex = process.argv.findIndex((value) => value === "--limit");
  const limitArgValue =
    limitArgIndex >= 0 ? process.argv[limitArgIndex + 1] : undefined;
  const parsedLimit = limitArgValue ? Number.parseInt(limitArgValue, 10) : null;
  const limit =
    parsedLimit && Number.isInteger(parsedLimit) && parsedLimit > 0
      ? parsedLimit
      : null;
  const rawFile = await readFile(SOURCE_FILE, "utf8");
  const parsedData = JSON.parse(rawFile);

  if (!Array.isArray(parsedData)) {
    throw new Error("Expected data/spells.json to contain a top-level array.");
  }

  const filteredPublisher = parsedData.filter(
    (entry): entry is RawSpell =>
      isRecord(entry) &&
      toTrimmedString(entry.publisher).toLowerCase() === WOTC_PUBLISHER
  );

  const rankedById = new Map<string, RankedSpell>();
  let skipped = 0;

  for (const [index, value] of filteredPublisher.entries()) {
    const parsed = toSpellWriteInput(value, index);
    if (!parsed) {
      skipped += 1;
      continue;
    }

    const score = scoreSpell(parsed);
    const existing = rankedById.get(parsed.id);
    if (!existing || score > existing.score) {
      rankedById.set(parsed.id, { score, spell: parsed });
    }
  }

  const dedupedSpells = [...rankedById.values()].map((entry) => entry.spell);
  const orderedSpells = dedupedSpells
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id));
  const selectedSpells = limit ? orderedSpells.slice(0, limit) : orderedSpells;
  const with2024 = dedupedSpells.filter((spell) =>
    spell.id.endsWith("-2024")
  ).length;

  if (dryRun) {
    console.log("Spell migration dry run complete.");
    console.log({
      importingCount: selectedSpells.length,
      deduped: dedupedSpells.length,
      limit,
      rawCount: parsedData.length,
      skipped,
      with2024,
      wotcCount: filteredPublisher.length,
    });
    return;
  }

  const { getAdminDb, hasRequiredServerFirebaseConfig } =
    await import("../lib/firebase-admin");

  if (!hasRequiredServerFirebaseConfig) {
    throw new Error(
      "Missing Firestore server env. Set FIREBASE_PROJECT_ID and service credentials if required."
    );
  }

  const summary = await upsertSpells(selectedSpells);
  const db = getAdminDb();

  await db
    .collection("meta")
    .doc("collections")
    .set(
      {
        spellsVersion: FieldValue.increment(summary.created + summary.updated),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  console.log("Spell migration complete.");
  console.log({
    created: summary.created,
    deduped: dedupedSpells.length,
    importingCount: selectedSpells.length,
    limit,
    skipped,
    updated: summary.updated,
    with2024,
    wotcCount: filteredPublisher.length,
  });
}

main().catch((error: unknown) => {
  console.error("Spell migration failed.", error);
  process.exitCode = 1;
});
