import { readFile } from "node:fs/promises";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { FieldValue } from "firebase-admin/firestore";

const SOURCE_FILE = path.join(
  process.cwd(),
  "app",
  "data",
  "additional-spell-meta.txt"
);
const BATCH_SIZE = 400;
const UPDATED_BY = "spell-meta-backfill";
const KNOWN_CLASSES = [
  "artificer",
  "bard",
  "cleric",
  "druid",
  "paladin",
  "ranger",
  "sorcerer",
  "warlock",
  "wizard",
] as const;
const KNOWN_CLASS_SET = new Set<string>(KNOWN_CLASSES);

type ParsedEntry = {
  classes: string[];
  name: string;
};

const normalizeWhitespace = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const normalizeName = (value: string): string =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/\s*\(2024\)\s*$/i, "");

const isSourceLine = (value: string): boolean =>
  value.includes("↗") ||
  /\bp\.\d+/i.test(value) ||
  /\b(?:player'?s handbook|basic rules|online supplement|companion|guide)\b/i.test(
    value
  );

const isLevelToken = (value: string): boolean =>
  /\bcantrip\b/i.test(value) || /\b\d+(?:st|nd|rd|th)-level\b/i.test(value);

const isDescriptorLine = (value: string): boolean =>
  /^ritual$/i.test(value) ||
  /^technomagic$/i.test(value) ||
  /^psionic$/i.test(value);

const parseClassLine = (value: string): string | null => {
  const token = normalizeWhitespace(value).toLowerCase();
  if (!token) {
    return null;
  }

  const base = token.split(/\s|\(/, 1)[0] ?? "";
  return KNOWN_CLASS_SET.has(base) ? base : null;
};

const parseLevelLine = (
  rawLine: string
): { levelIndex: number; namePart: string | null } | null => {
  const columns = rawLine.split("\t").map((part) => normalizeWhitespace(part));
  for (const [index, column] of columns.entries()) {
    if (!isLevelToken(column)) {
      continue;
    }

    const namePart = normalizeWhitespace(columns.slice(0, index).join(" "));
    return {
      levelIndex: index,
      namePart: namePart || null,
    };
  }

  return null;
};

function parseMetaFile(content: string): ParsedEntry[] {
  const lines = content.split(/\r?\n/).map((line) => line.trimEnd());
  const entries: ParsedEntry[] = [];

  let pendingNameLines: string[] = [];
  let currentEntry: ParsedEntry | null = null;

  const flushCurrent = () => {
    if (!currentEntry || !currentEntry.name || !currentEntry.classes.length) {
      currentEntry = null;
      return;
    }

    entries.push({
      classes: [...new Set(currentEntry.classes)],
      name: currentEntry.name,
    });
    currentEntry = null;
  };

  for (const rawLine of lines) {
    const line = normalizeWhitespace(rawLine);
    if (!line || line === "Name Level & School Classes Sources") {
      continue;
    }

    const levelLine = parseLevelLine(rawLine);
    if (levelLine) {
      flushCurrent();

      const inheritedName = pendingNameLines
        .filter((part) => !isDescriptorLine(part))
        .join(" ");
      const levelName = levelLine.namePart ?? "";
      const name = normalizeWhitespace(levelName || inheritedName);
      pendingNameLines = [];

      if (!name) {
        continue;
      }

      currentEntry = {
        classes: [],
        name,
      };
      continue;
    }

    if (isSourceLine(line)) {
      continue;
    }

    const parsedClass = parseClassLine(line);
    if (parsedClass && currentEntry) {
      currentEntry.classes.push(parsedClass);
      continue;
    }

    if (currentEntry && !parsedClass) {
      flushCurrent();
    }

    pendingNameLines.push(line);
  }

  flushCurrent();

  return entries;
}

function toClassMap(entries: ParsedEntry[]): Map<string, string[]> {
  const map = new Map<string, Set<string>>();

  for (const entry of entries) {
    const key = normalizeName(entry.name);
    if (!key) {
      continue;
    }

    const existing = map.get(key) ?? new Set<string>();
    entry.classes.forEach((cls) => existing.add(cls));
    map.set(key, existing);
  }

  return new Map(
    [...map.entries()].map(([name, classes]) => [
      name,
      [...classes].sort((a, b) => a.localeCompare(b)),
    ])
  );
}

function mergeClasses(existing: unknown, incoming: string[]): string[] {
  const current = Array.isArray(existing)
    ? existing
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().toLowerCase())
        .filter((item) => KNOWN_CLASS_SET.has(item))
    : [];

  return [...new Set([...current, ...incoming])].sort((a, b) =>
    a.localeCompare(b)
  );
}

async function main() {
  loadEnvConfig(process.cwd());

  const dryRun = process.argv.includes("--dry-run");
  const file = await readFile(SOURCE_FILE, "utf8");
  const entries = parseMetaFile(file);
  const classMap = toClassMap(entries);

  const { getAdminDb, hasRequiredServerFirebaseConfig } =
    await import("../lib/firebase-admin");
  if (!hasRequiredServerFirebaseConfig) {
    throw new Error(
      "Missing Firestore server env. Set FIREBASE_PROJECT_ID and service credentials if required."
    );
  }

  const db = getAdminDb();
  const spellsSnapshot = await db.collection("spells").get();

  let matched = 0;
  let updated = 0;
  let unchanged = 0;
  const pendingUpdates: Array<{ classes: string[]; id: string }> = [];

  for (const doc of spellsSnapshot.docs) {
    const data = doc.data();
    const nameValue =
      typeof data.nameNormalized === "string"
        ? normalizeName(data.nameNormalized)
        : typeof data.name === "string"
          ? normalizeName(data.name)
          : "";

    if (!nameValue) {
      unchanged += 1;
      continue;
    }

    const mappedClasses = classMap.get(nameValue);
    if (!mappedClasses || !mappedClasses.length) {
      unchanged += 1;
      continue;
    }

    matched += 1;
    const merged = mergeClasses(data.classes, mappedClasses);
    const existing = mergeClasses(data.classes, []);
    const changed = merged.join("|") !== existing.join("|");
    if (!changed) {
      unchanged += 1;
      continue;
    }

    updated += 1;
    pendingUpdates.push({ classes: merged, id: doc.id });
  }

  if (!dryRun) {
    for (let start = 0; start < pendingUpdates.length; start += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = pendingUpdates.slice(start, start + BATCH_SIZE);
      for (const update of chunk) {
        batch.set(
          db.collection("spells").doc(update.id),
          {
            classes: update.classes,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: UPDATED_BY,
          },
          { merge: true }
        );
      }

      await batch.commit();
      console.log(
        `Committed class backfill batch ${Math.floor(start / BATCH_SIZE) + 1} (${chunk.length} spells).`
      );
    }

    if (updated > 0) {
      await db
        .collection("meta")
        .doc("collections")
        .set(
          {
            spellsVersion: FieldValue.increment(updated),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
    }
  }

  console.log("Spell class backfill complete.");
  console.log({
    dryRun,
    entriesParsed: entries.length,
    mappedNames: classMap.size,
    matchedSpells: matched,
    unchanged,
    updated,
  });
}

main().catch((error: unknown) => {
  console.error("Spell class backfill failed.", error);
  process.exitCode = 1;
});
