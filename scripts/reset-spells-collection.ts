import { loadEnvConfig } from "@next/env";
import { FieldValue } from "firebase-admin/firestore";

const BATCH_SIZE = 400;

async function deleteSpellsCollection(): Promise<number> {
  const { getAdminDb } = await import("../lib/firebase-admin");
  const db = getAdminDb();
  let deleted = 0;

  while (true) {
    const snapshot = await db.collection("spells").limit(BATCH_SIZE).get();
    if (snapshot.empty) {
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    deleted += snapshot.size;
    console.log(`Deleted ${deleted} spell docs so far...`);
  }

  return deleted;
}

async function main() {
  loadEnvConfig(process.cwd());

  const { getAdminDb, hasRequiredServerFirebaseConfig } = await import(
    "../lib/firebase-admin"
  );

  if (!hasRequiredServerFirebaseConfig) {
    throw new Error(
      "Missing Firestore server env. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID and service credentials if required."
    );
  }

  const deleted = await deleteSpellsCollection();
  const db = getAdminDb();

  await db
    .collection("meta")
    .doc("collections")
    .set(
      {
        spellsVersion: 0,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  console.log("Spells collection reset complete.");
  console.log({ deleted, spellsVersion: 0 });
}

main().catch((error: unknown) => {
  console.error("Spells collection reset failed.", error);
  process.exitCode = 1;
});
