import { FieldValue } from "firebase-admin/firestore";
import { type NextRequest } from "next/server";

import { canWrite } from "@/lib/api/auth";
import {
  API_ERROR_CODES,
  jsonError,
  jsonSuccess,
} from "@/lib/api/envelope";
import {
  serializeSpell,
  toSpellFirestoreDoc,
} from "@/lib/api/firestore";
import { spellSchema, spellWriteSchema } from "@/lib/domain/spell.schema";
import {
  getAdminDb,
  hasRequiredServerFirebaseConfig,
} from "@/lib/firebase-admin";

const SPELLS_COLLECTION = "spells";
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
    const snapshot = await db.collection(SPELLS_COLLECTION).get();

    const spells = snapshot.docs.map((doc) => {
      const serialized = serializeSpell(doc.id, doc.data());
      return spellSchema.parse(serialized);
    });

    return jsonSuccess(spells);
  } catch (error) {
    console.error(error);
    return jsonError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Failed to fetch spells.",
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
    const parsed = spellWriteSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(
        API_ERROR_CODES.VALIDATION_ERROR,
        "Invalid spell payload.",
        400,
        parsed.error.flatten()
      );
    }

    const db = getAdminDb();
    const docRef = db.collection(SPELLS_COLLECTION).doc(parsed.data.id);
    const existingDoc = await docRef.get();

    if (existingDoc.exists) {
      return jsonError(
        API_ERROR_CODES.VALIDATION_ERROR,
        `Spell '${parsed.data.id}' already exists. Use PUT for updates.`,
        409
      );
    }

    await docRef.set(toSpellFirestoreDoc(parsed.data, FieldValue.serverTimestamp()));

    await db.collection(META_COLLECTION).doc(META_DOC).set(
      {
        spellsVersion: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const created = await docRef.get();
    const serialized = serializeSpell(created.id, created.data());

    return jsonSuccess(spellSchema.parse(serialized), 201);
  } catch (error) {
    console.error(error);
    return jsonError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Failed to create spell.",
      500
    );
  }
}
