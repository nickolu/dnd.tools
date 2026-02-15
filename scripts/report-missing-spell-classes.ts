import { writeFile } from "node:fs/promises";
import path from "node:path";

import { loadEnvConfig } from "@next/env";

const OUTPUT_FILE = path.join(
  process.cwd(),
  "docs",
  "missing-spell-classes.json"
);

type MissingSpellRow = {
  id: string;
  level: number;
  name: string;
  source: string;
};

async function main() {
  loadEnvConfig(process.cwd());

  const { getAdminDb, hasRequiredServerFirebaseConfig } =
    await import("../lib/firebase-admin");
  if (!hasRequiredServerFirebaseConfig) {
    throw new Error(
      "Missing Firestore server env. Set FIREBASE_PROJECT_ID and service credentials if required."
    );
  }

  const db = getAdminDb();
  const snapshot = await db.collection("spells").get();

  const missing: MissingSpellRow[] = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const classes = Array.isArray(data.classes)
      ? data.classes.filter(
          (entry): entry is string => typeof entry === "string"
        )
      : [];

    if (classes.length > 0) {
      continue;
    }

    missing.push({
      id: doc.id,
      level: typeof data.level === "number" ? data.level : -1,
      name: typeof data.name === "string" ? data.name : doc.id,
      source: typeof data.source === "string" ? data.source : "Unknown",
    });
  }

  const sorted = missing.sort((left, right) => {
    const byLevel = left.level - right.level;
    if (byLevel !== 0) {
      return byLevel;
    }
    return left.name.localeCompare(right.name);
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    summary: {
      missingCount: sorted.length,
      total: snapshot.size,
      withClasses: snapshot.size - sorted.length,
    },
    spells: sorted,
  };

  await writeFile(OUTPUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log("Missing spell classes report generated.");
  console.log(`Report: ${OUTPUT_FILE}`);
  console.log(payload.summary);
}

main().catch((error: unknown) => {
  console.error("Missing spell classes report failed.", error);
  process.exitCode = 1;
});
