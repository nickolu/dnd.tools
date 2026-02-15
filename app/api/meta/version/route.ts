import { Timestamp } from "firebase-admin/firestore";

import { API_ERROR_CODES, jsonError, jsonSuccess } from "@/lib/api/envelope";
import { jsonFirestoreError } from "@/lib/api/firestore-error";
import { collectionVersionSchema } from "@/lib/domain/meta.schema";
import {
  getAdminDb,
  hasRequiredServerFirebaseConfig,
} from "@/lib/firebase-admin";

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
    const snapshot = await db.collection(META_COLLECTION).doc(META_DOC).get();

    const data = snapshot.data();

    const payload = {
      monstersVersion:
        typeof data?.monstersVersion === "number" ? data.monstersVersion : 0,
      spellsVersion:
        typeof data?.spellsVersion === "number" ? data.spellsVersion : 0,
      updatedAt:
        data?.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate().toISOString()
          : new Date(0).toISOString(),
    };

    return jsonSuccess(collectionVersionSchema.parse(payload));
  } catch (error) {
    console.error(error);
    return jsonFirestoreError(error, "Failed to fetch collection versions.");
  }
}
