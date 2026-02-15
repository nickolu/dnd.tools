import { FieldValue, Timestamp } from "firebase-admin/firestore";

import type { MonsterWriteInput } from "@/lib/domain/monster.schema";
import type { SpellWriteInput } from "@/lib/domain/spell.schema";

type FirestoreRecord = Record<string, unknown>;

type FirestoreTimestampLike = {
  toDate: () => Date;
};

const isRecord = (value: unknown): value is FirestoreRecord =>
  typeof value === "object" && value !== null;

const isTimestampLike = (value: unknown): value is FirestoreTimestampLike =>
  isRecord(value) && typeof value.toDate === "function";

const toIsoString = (value: unknown): string => {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (isTimestampLike(value)) {
    return value.toDate().toISOString();
  }

  throw new Error("Document has invalid timestamp field.");
};

const toSerializedDoc = (id: string, raw: unknown): FirestoreRecord => {
  if (!isRecord(raw)) {
    throw new Error("Firestore document is not an object.");
  }

  return {
    ...raw,
    createdAt: toIsoString(raw.createdAt),
    id,
    updatedAt: toIsoString(raw.updatedAt),
  };
};

export const serializeMonster = (id: string, raw: unknown): FirestoreRecord =>
  toSerializedDoc(id, raw);

export const serializeSpell = (id: string, raw: unknown): FirestoreRecord =>
  toSerializedDoc(id, raw);

export const toMonsterFirestoreDoc = (
  input: MonsterWriteInput,
  now: FieldValue
): FirestoreRecord => ({
  ...input,
  createdAt: now,
  updatedAt: now,
});

export const toMonsterUpdateDoc = (
  input: MonsterWriteInput,
  now: FieldValue,
  existingCreatedAt: unknown
): FirestoreRecord => ({
  ...input,
  createdAt: existingCreatedAt,
  updatedAt: now,
});

export const toSpellFirestoreDoc = (
  input: SpellWriteInput,
  now: FieldValue
): FirestoreRecord => ({
  ...input,
  createdAt: now,
  updatedAt: now,
});

export const toSpellUpdateDoc = (
  input: SpellWriteInput,
  now: FieldValue,
  existingCreatedAt: unknown
): FirestoreRecord => ({
  ...input,
  createdAt: existingCreatedAt,
  updatedAt: now,
});
