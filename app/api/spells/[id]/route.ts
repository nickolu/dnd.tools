import { FieldValue } from "firebase-admin/firestore";
import { type NextRequest } from "next/server";

import { canWrite } from "@/lib/api/auth";
import {
  API_ERROR_CODES,
  jsonError,
  jsonSuccess,
} from "@/lib/api/envelope";
import { serializeSpell, toSpellUpdateDoc } from "@/lib/api/firestore";
import { spellSchema, spellWriteSchema } from "@/lib/domain/spell.schema";
import {
  getAdminDb,
  hasRequiredServerFirebaseConfig,
} from "@/lib/firebase-admin";

const SPELLS_COLLECTION = "spells";
const META_COLLECTION = "meta";
const META_DOC = "collections";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!hasRequiredServerFirebaseConfig) {
    return jsonError(
      API_ERROR_CODES.FIREBASE_NOT_CONFIGURED,
      "Firestore is not configured.",
      503
    );
  }

  try {
    const { id } = await context.params;
    const db = getAdminDb();
    const snapshot = await db.collection(SPELLS_COLLECTION).doc(id).get();

    if (!snapshot.exists) {
      return jsonError(API_ERROR_CODES.NOT_FOUND, `Spell '${id}' not found.`, 404);
    }

    const serialized = serializeSpell(snapshot.id, snapshot.data());
    return jsonSuccess(spellSchema.parse(serialized));
  } catch (error) {
    console.error(error);
    return jsonError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Failed to fetch spell.",
      500
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
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
    const { id } = await context.params;
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

    if (parsed.data.id !== id) {
      return jsonError(
        API_ERROR_CODES.VALIDATION_ERROR,
        "Payload id must match route id.",
        400
      );
    }

    const db = getAdminDb();
    const docRef = db.collection(SPELLS_COLLECTION).doc(id);
    const existingDoc = await docRef.get();

    if (!existingDoc.exists) {
      return jsonError(API_ERROR_CODES.NOT_FOUND, `Spell '${id}' not found.`, 404);
    }

    await docRef.set(
      toSpellUpdateDoc(
        parsed.data,
        FieldValue.serverTimestamp(),
        existingDoc.get("createdAt")
      )
    );

    await db.collection(META_COLLECTION).doc(META_DOC).set(
      {
        spellsVersion: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const updated = await docRef.get();
    const serialized = serializeSpell(updated.id, updated.data());

    return jsonSuccess(spellSchema.parse(serialized));
  } catch (error) {
    console.error(error);
    return jsonError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Failed to update spell.",
      500
    );
  }
}
