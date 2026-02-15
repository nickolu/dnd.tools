import { FieldValue } from "firebase-admin/firestore";
import { type NextRequest } from "next/server";

import { canWrite } from "@/lib/api/auth";
import { API_ERROR_CODES, jsonError, jsonSuccess } from "@/lib/api/envelope";
import { serializeMonster, toMonsterUpdateDoc } from "@/lib/api/firestore";
import { monsterSchema, monsterWriteSchema } from "@/lib/domain/monster.schema";
import {
  getAdminDb,
  hasRequiredServerFirebaseConfig,
} from "@/lib/firebase-admin";

const MONSTERS_COLLECTION = "monsters";
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
    const snapshot = await db.collection(MONSTERS_COLLECTION).doc(id).get();

    if (!snapshot.exists) {
      return jsonError(
        API_ERROR_CODES.NOT_FOUND,
        `Monster '${id}' not found.`,
        404
      );
    }

    const serialized = serializeMonster(snapshot.id, snapshot.data());
    return jsonSuccess(monsterSchema.parse(serialized));
  } catch (error) {
    console.error(error);
    return jsonError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Failed to fetch monster.",
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
    const parsed = monsterWriteSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(
        API_ERROR_CODES.VALIDATION_ERROR,
        "Invalid monster payload.",
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
    const docRef = db.collection(MONSTERS_COLLECTION).doc(id);
    const existingDoc = await docRef.get();

    if (!existingDoc.exists) {
      return jsonError(
        API_ERROR_CODES.NOT_FOUND,
        `Monster '${id}' not found.`,
        404
      );
    }

    await docRef.set(
      toMonsterUpdateDoc(
        parsed.data,
        FieldValue.serverTimestamp(),
        existingDoc.get("createdAt")
      )
    );

    await db
      .collection(META_COLLECTION)
      .doc(META_DOC)
      .set(
        {
          monstersVersion: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    const updated = await docRef.get();
    const serialized = serializeMonster(updated.id, updated.data());

    return jsonSuccess(monsterSchema.parse(serialized));
  } catch (error) {
    console.error(error);
    return jsonError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "Failed to update monster.",
      500
    );
  }
}
