import { FieldValue } from "firebase-admin/firestore";
import { type NextRequest } from "next/server";

import { canWrite } from "@/lib/api/auth";
import {
  API_ERROR_CODES,
  jsonError,
  jsonSuccess,
} from "@/lib/api/envelope";
import {
  serializeMonster,
  toMonsterFirestoreDoc,
} from "@/lib/api/firestore";
import { monsterSchema, monsterWriteSchema } from "@/lib/domain/monster.schema";
import {
  getAdminDb,
  hasRequiredServerFirebaseConfig,
} from "@/lib/firebase-admin";

const MONSTERS_COLLECTION = "monsters";
const META_COLLECTION = "meta";
const META_DOC = "collections";

export async function GET() {
  if (!hasRequiredServerFirebaseConfig) {
    return jsonError(
      API_ERROR_CODES.FIREBASE_NOT_CONFIGURED,
      "Firestore is not configured.",
      503
    );
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection(MONSTERS_COLLECTION).get();

    const monsters = snapshot.docs.map((doc) => {
      const serialized = serializeMonster(doc.id, doc.data());
      return monsterSchema.parse(serialized);
    });

    return jsonSuccess(monsters);
  } catch (error) {
    console.error(error);
    return jsonError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Failed to fetch monsters.",
      500
    );
  }
}

export async function POST(request: NextRequest) {
  if (!canWrite(request)) {
    return jsonError(
      API_ERROR_CODES.FORBIDDEN,
      "Write access requires admin/editor role.",
      403
    );
  }

  if (!hasRequiredServerFirebaseConfig) {
    return jsonError(
      API_ERROR_CODES.FIREBASE_NOT_CONFIGURED,
      "Firestore is not configured.",
      503
    );
  }

  try {
    const body = await request.json();
    const parsed = monsterWriteSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(
        API_ERROR_CODES.VALIDATION_ERROR,
        "Invalid monster payload.",
        400,
        parsed.error.flatten()
      );
    }

    const db = getAdminDb();
    const docRef = db.collection(MONSTERS_COLLECTION).doc(parsed.data.id);
    const existingDoc = await docRef.get();

    if (existingDoc.exists) {
      return jsonError(
        API_ERROR_CODES.VALIDATION_ERROR,
        `Monster '${parsed.data.id}' already exists. Use PUT for updates.`,
        409
      );
    }

    await docRef.set(toMonsterFirestoreDoc(parsed.data, FieldValue.serverTimestamp()));

    await db.collection(META_COLLECTION).doc(META_DOC).set(
      {
        monstersVersion: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const created = await docRef.get();
    const serialized = serializeMonster(created.id, created.data());

    return jsonSuccess(monsterSchema.parse(serialized), 201);
  } catch (error) {
    console.error(error);
    return jsonError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Failed to create monster.",
      500
    );
  }
}
