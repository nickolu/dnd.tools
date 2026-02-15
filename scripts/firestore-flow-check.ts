import { randomUUID } from "node:crypto";

import { loadEnvConfig } from "@next/env";
import { Timestamp } from "firebase-admin/firestore";

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
  const runId = randomUUID();
  const docRef = db.collection("meta").doc(`flow-check-${runId}`);

  const writePayload = {
    note: "one-time firestore flow check",
    runId,
    writtenAt: Timestamp.now(),
  };

  console.log("Writing test doc", { id: docRef.id });
  await docRef.set(writePayload);

  const readBack = await docRef.get();
  if (!readBack.exists) {
    throw new Error("Flow-check document was not found after write.");
  }

  const data = readBack.data();
  if (!data || data.runId !== runId) {
    throw new Error("Flow-check data mismatch.");
  }

  console.log("Read back test doc", {
    runId: data.runId,
    writtenAt: data.writtenAt?.toDate?.()?.toISOString?.() ?? "unknown",
  });

  await docRef.delete();
  console.log("Deleted test doc", { id: docRef.id });

  console.log("Firestore flow check passed.");
}

main().catch((error: unknown) => {
  console.error("Firestore flow check failed.", error);
  process.exitCode = 1;
});
