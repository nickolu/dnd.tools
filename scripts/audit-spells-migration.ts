import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { toNameNormalized, toSlug } from "@/lib/admin/ingest";
import {
  type SpellWriteInput,
  spellWriteSchema,
} from "@/lib/domain/spell.schema";

type RawSpell = Record<string, unknown>;

type Candidate = {
  id: string;
  index: number;
  name: string;
  score: number;
  source: string;
  spell: SpellWriteInput;
};

type SkipEntry = {
  index: number;
  name: string;
  reason: string;
  source: string;
};

type CollisionGroup = {
  id: string;
  kept: Candidate;
  losers: Candidate[];
};

const SOURCE_FILE = path.join(process.cwd(), "data", "spells.json");
const REPORT_FILE = path.join(
  process.cwd(),
  "docs",
  "spell-migration-audit.json"
);
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

const splitCsv = (value: string): string[] =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

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
  const normalized = toTrimmedString(value).toLowerCase();

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
  const match = normalizeText(value).match(
    new RegExp(`${escaped}\\s*:\\s*([^\\n]+)`, "i")
  );
  return match?.[1]?.trim() ?? "";
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
      entries.map((entry) => entry.trim().toLowerCase()).filter(Boolean)
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

const toCandidate = (
  rawSpell: RawSpell,
  index: number
): { candidate: Candidate | null; skipReason: string | null } => {
  const publisher = toTrimmedString(rawSpell.publisher);
  if (publisher.toLowerCase() !== WOTC_PUBLISHER) {
    return { candidate: null, skipReason: "non_wotc_publisher" };
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
    return { candidate: null, skipReason: "missing_id" };
  }

  const properties = isRecord(rawSpell.properties) ? rawSpell.properties : {};
  const payload = parseDataRecordPayload(properties, nameRaw);

  const rawDescription =
    toTrimmedString(payload?.description) ||
    toTrimmedString(properties["data-description"]) ||
    toTrimmedString(rawSpell.description);

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

  const castingTime =
    toTrimmedString(payload?.castingTime) ||
    toTrimmedString(properties["Casting Time"]) ||
    extractFromLabeledText(rawDescription, "Casting Time") ||
    "1 action";

  const range =
    toTrimmedString(payload?.range) ||
    toTrimmedString(properties.Range) ||
    toTrimmedString(properties["data-RangeAoe"]) ||
    extractFromLabeledText(rawDescription, "Range") ||
    "Self";

  const duration =
    toTrimmedString(payload?.duration) ||
    toTrimmedString(properties.Duration) ||
    extractFromLabeledText(rawDescription, "Duration") ||
    "Instantaneous";

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
    return { candidate: null, skipReason: "invalid_level_or_school" };
  }

  const componentsFromPayload = isRecord(payload?.components)
    ? payload.components
    : null;

  const componentsText =
    toTrimmedString(properties.Components) ||
    extractFromLabeledText(rawDescription, "Components");

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
    : parseComponentText(componentsText);

  const classesRaw = payload?.classes ?? properties.Classes ?? "";
  const classes =
    typeof classesRaw === "string" || Array.isArray(classesRaw)
      ? cleanClasses(classesRaw)
      : [];

  const concentration =
    parseBoolean(payload?.concentration) ??
    parseBoolean(properties.Concentration) ??
    /\bconcentration\b/i.test(duration);

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

  const parsed = {
    castingTime,
    classes,
    components,
    concentration,
    createdBy: "spell-json-migration",
    description: description.length
      ? description
      : ["Spell description unavailable."],
    duration,
    id,
    isPublished: true,
    level,
    name,
    nameNormalized: toNameNormalized(name),
    range,
    ritual,
    schemaVersion: 1,
    school,
    source,
    updatedBy: "spell-json-migration",
    ...(attackType ? { attackType } : {}),
    ...(damage ? { damage } : {}),
    ...(higherLevel.length ? { higherLevel } : {}),
    ...(publisher ? { publisher } : {}),
    ...(save ? { save } : {}),
  };

  const validated = spellWriteSchema.safeParse(parsed);
  if (!validated.success) {
    return { candidate: null, skipReason: "schema_validation_failed" };
  }

  return {
    candidate: {
      id: validated.data.id,
      index,
      name: validated.data.name,
      score: scoreSpell(validated.data),
      source: validated.data.source,
      spell: validated.data,
    },
    skipReason: null,
  };
};

async function main() {
  const rawFile = await readFile(SOURCE_FILE, "utf8");
  const parsedData = JSON.parse(rawFile);
  if (!Array.isArray(parsedData)) {
    throw new Error("Expected data/spells.json to contain a top-level array.");
  }

  const candidatesById = new Map<string, Candidate[]>();
  const skipped: SkipEntry[] = [];
  let wotcCount = 0;

  for (const [index, entry] of parsedData.entries()) {
    if (!isRecord(entry)) {
      skipped.push({
        index,
        name: `index:${index}`,
        reason: "record_not_object",
        source: "",
      });
      continue;
    }

    if (toTrimmedString(entry.publisher).toLowerCase() === WOTC_PUBLISHER) {
      wotcCount += 1;
    }

    const { candidate, skipReason } = toCandidate(entry, index);
    if (!candidate) {
      if (skipReason === "non_wotc_publisher") {
        continue;
      }

      skipped.push({
        index,
        name: toTrimmedString(entry.name) || `index:${index}`,
        reason: skipReason ?? "unknown",
        source: toTrimmedString(entry.book),
      });
      continue;
    }

    const bucket = candidatesById.get(candidate.id) ?? [];
    bucket.push(candidate);
    candidatesById.set(candidate.id, bucket);
  }

  const collisions: CollisionGroup[] = [];
  const winners: Candidate[] = [];

  for (const [id, bucket] of candidatesById) {
    const sorted = [...bucket].sort((a, b) => b.score - a.score);
    const kept = sorted[0];
    if (!kept) {
      continue;
    }

    winners.push(kept);
    const losers = sorted.slice(1);
    if (losers.length) {
      collisions.push({ id, kept, losers });
    }
  }

  const skipByReason = skipped.reduce<Record<string, number>>((acc, item) => {
    acc[item.reason] = (acc[item.reason] ?? 0) + 1;
    return acc;
  }, {});

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      dedupedCount: winners.length,
      rawCount: parsedData.length,
      skippedCount: skipped.length,
      with2024Count: winners.filter((spell) => spell.id.endsWith("-2024"))
        .length,
      wotcCount,
    },
    skipByReason,
    topCollisions: collisions
      .sort((a, b) => b.losers.length - a.losers.length)
      .slice(0, 50)
      .map((entry) => ({
        id: entry.id,
        kept: {
          index: entry.kept.index,
          name: entry.kept.name,
          score: entry.kept.score,
          source: entry.kept.source,
        },
        loserCount: entry.losers.length,
        losers: entry.losers.slice(0, 8).map((loser) => ({
          index: loser.index,
          name: loser.name,
          score: loser.score,
          source: loser.source,
        })),
      })),
    skipped: skipped.slice(0, 200),
  };

  await writeFile(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("Spell migration audit complete.");
  console.log(`Report: ${REPORT_FILE}`);
  console.log(report.summary);
  console.log("Skip reasons:", skipByReason);
  console.log(
    "Largest collision groups:",
    collisions
      .sort((a, b) => b.losers.length - a.losers.length)
      .slice(0, 10)
      .map((entry) => ({ id: entry.id, variants: entry.losers.length + 1 }))
  );
}

main().catch((error: unknown) => {
  console.error("Spell migration audit failed.", error);
  process.exitCode = 1;
});
