import { loadEnvConfig } from "@next/env";
import { FieldValue } from "firebase-admin/firestore";

const BATCH_SIZE = 400;
const UPDATED_BY = "spell-quality-normalizer";

const normalizeForDuplicationCheck = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeSpellRange = (value: string): string => {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.replace(/\bfoots\b/gi, "feet");
};

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

const normalizeDescription = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const next: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }

    const collapsed = collapseDuplicatedParagraph(item);
    const normalized = collapsed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    next.push(collapsed);
  }

  return next;
};

async function main() {
  loadEnvConfig(process.cwd());
  const dryRun = process.argv.includes("--dry-run");

  const { getAdminDb, hasRequiredServerFirebaseConfig } =
    await import("../lib/firebase-admin");
  if (!hasRequiredServerFirebaseConfig) {
    throw new Error(
      "Missing Firestore server env. Set FIREBASE_PROJECT_ID and service credentials if required."
    );
  }

  const db = getAdminDb();
  const snapshot = await db.collection("spells").get();

  const updates: Array<{
    description: string[];
    id: string;
    range: string;
  }> = [];
  let unchanged = 0;
  let withFoots = 0;
  let withDescriptionDupes = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const currentRange = typeof data.range === "string" ? data.range : "";
    const currentDescription = Array.isArray(data.description)
      ? data.description
      : [];

    const nextRange = normalizeSpellRange(currentRange);
    const nextDescription = normalizeDescription(currentDescription);
    const rangeChanged = nextRange !== currentRange;
    const descriptionChanged =
      JSON.stringify(nextDescription) !== JSON.stringify(currentDescription);

    if (/\bfoots\b/i.test(currentRange)) {
      withFoots += 1;
    }

    if (descriptionChanged) {
      withDescriptionDupes += 1;
    }

    if (!rangeChanged && !descriptionChanged) {
      unchanged += 1;
      continue;
    }

    updates.push({
      description: nextDescription.length
        ? nextDescription
        : ["Spell description unavailable."],
      id: doc.id,
      range: nextRange || "Self",
    });
  }

  if (!dryRun) {
    for (let start = 0; start < updates.length; start += BATCH_SIZE) {
      const chunk = updates.slice(start, start + BATCH_SIZE);
      const batch = db.batch();

      for (const update of chunk) {
        batch.set(
          db.collection("spells").doc(update.id),
          {
            description: update.description,
            range: update.range,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: UPDATED_BY,
          },
          { merge: true }
        );
      }

      await batch.commit();
      console.log(
        `Committed spell quality batch ${Math.floor(start / BATCH_SIZE) + 1} (${chunk.length} spells).`
      );
    }

    if (updates.length > 0) {
      await db
        .collection("meta")
        .doc("collections")
        .set(
          {
            spellsVersion: FieldValue.increment(updates.length),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
    }
  }

  console.log("Spell quality normalization complete.");
  console.log({
    dryRun,
    total: snapshot.size,
    unchanged,
    updated: updates.length,
    withDescriptionDupes,
    withFoots,
  });
}

main().catch((error: unknown) => {
  console.error("Spell quality normalization failed.", error);
  process.exitCode = 1;
});
