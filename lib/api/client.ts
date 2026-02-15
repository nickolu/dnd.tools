import { get, set } from "idb-keyval";
import { z } from "zod";

import type { CollectionVersion } from "@/lib/domain/meta.schema";
import { collectionVersionSchema } from "@/lib/domain/meta.schema";
import { monsterSchema } from "@/lib/domain/monster.schema";
import { spellSchema } from "@/lib/domain/spell.schema";

const STORAGE_KEYS = {
  metaVersion: "dnd-tools:cache:meta-version",
  monsters: "dnd-tools:cache:monsters",
  spells: "dnd-tools:cache:spells",
} as const;

const META_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

type CachedCollectionPayload<T> = {
  data: T[];
  version: number;
};

type CachedMetaVersionPayload = {
  fetchedAt: number;
  value: CollectionVersion;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object";

const canUseBrowserStorage = () => typeof window !== "undefined";

class ApiClientError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const apiSuccessSchema = z.object({
  data: z.unknown(),
  ok: z.literal(true),
});

const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
  ok: z.literal(false),
});

const apiEnvelopeSchema = z.union([apiSuccessSchema, apiErrorSchema]);

let inMemoryMetaVersionCache: CachedMetaVersionPayload | null = null;
let inFlightMetaVersionRequest: Promise<CollectionVersion> | null = null;

const parseResponse = async (response: Response): Promise<unknown> => {
  const payload = apiEnvelopeSchema.parse(await response.json());

  if (!payload.ok) {
    throw new ApiClientError(payload.error.code, payload.error.message);
  }

  return payload.data;
};

const getJson = async <T>(path: string, schema: z.ZodType<T>): Promise<T> => {
  const response = await fetch(path);

  return schema.parse(await parseResponse(response));
};

const readCachedMetaVersion =
  async (): Promise<CachedMetaVersionPayload | null> => {
    if (inMemoryMetaVersionCache) {
      return inMemoryMetaVersionCache;
    }

    if (!canUseBrowserStorage()) {
      return null;
    }

    const raw = await get<unknown>(STORAGE_KEYS.metaVersion);
    if (!isRecord(raw)) {
      return null;
    }

    const fetchedAt = Reflect.get(raw, "fetchedAt");
    const value = Reflect.get(raw, "value");

    if (typeof fetchedAt !== "number") {
      return null;
    }

    const parsedValue = collectionVersionSchema.safeParse(value);
    if (!parsedValue.success) {
      return null;
    }

    const parsed: CachedMetaVersionPayload = {
      fetchedAt,
      value: parsedValue.data,
    };

    inMemoryMetaVersionCache = parsed;
    return parsed;
  };

const writeCachedMetaVersion = async (value: CollectionVersion) => {
  const payload: CachedMetaVersionPayload = {
    fetchedAt: Date.now(),
    value,
  };

  inMemoryMetaVersionCache = payload;

  if (!canUseBrowserStorage()) {
    return;
  }

  await set(STORAGE_KEYS.metaVersion, payload);
};

const isMetaVersionFresh = (cached: CachedMetaVersionPayload) =>
  Date.now() - cached.fetchedAt < META_REFRESH_INTERVAL_MS;

const getCachedMetaVersion = async (): Promise<CollectionVersion> => {
  const cached = await readCachedMetaVersion();
  if (cached && isMetaVersionFresh(cached)) {
    return cached.value;
  }

  if (inFlightMetaVersionRequest) {
    return inFlightMetaVersionRequest;
  }

  inFlightMetaVersionRequest = getJson("/api/meta/version", collectionVersionSchema)
    .then(async (fresh) => {
      await writeCachedMetaVersion(fresh);
      return fresh;
    })
    .catch((error) => {
      if (cached) {
        return cached.value;
      }

      throw error;
    })
    .finally(() => {
      inFlightMetaVersionRequest = null;
    });

  return inFlightMetaVersionRequest;
};

const readCachedCollection = async <T>(
  storageKey: string,
  schema: z.ZodType<T>
): Promise<CachedCollectionPayload<T> | null> => {
  if (!canUseBrowserStorage()) {
    return null;
  }

  const raw = await get<unknown>(storageKey);
  if (!isRecord(raw)) {
    return null;
  }

  const version = Reflect.get(raw, "version");
  const data = Reflect.get(raw, "data");

  if (typeof version !== "number") {
    return null;
  }

  const parsedData = z.array(schema).safeParse(data);
  if (!parsedData.success) {
    return null;
  }

  return {
    data: parsedData.data,
    version,
  };
};

const writeCachedCollection = async <T>(
  storageKey: string,
  version: number,
  data: T[]
) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  await set(storageKey, { data, version });
};

const getCollectionWithPersistentCache = async <T>(
  storageKey: string,
  path: string,
  schema: z.ZodType<T>,
  getVersion: (version: CollectionVersion) => number
) => {
  const cached = await readCachedCollection(storageKey, schema);

  let metaVersion: CollectionVersion | null = null;
  try {
    metaVersion = await getCachedMetaVersion();
  } catch (error) {
    if (cached) {
      return cached.data;
    }

    throw error;
  }

  const nextVersion = getVersion(metaVersion);
  if (cached && cached.version === nextVersion) {
    return cached.data;
  }

  const fresh = await getJson(path, z.array(schema));
  await writeCachedCollection(storageKey, nextVersion, fresh);

  return fresh;
};

export const getReadableFetchError = (
  error: unknown,
  resourceLabel: string
): string => {
  if (error instanceof ApiClientError) {
    if (error.code === "QUOTA_EXCEEDED") {
      return `We hit a data quota while loading ${resourceLabel}. Showing cached data when available.`;
    }

    if (error.code === "SERVICE_UNAVAILABLE") {
      return `The data service is temporarily unavailable for ${resourceLabel}.`;
    }

    if (error.code === "FIREBASE_NOT_CONFIGURED") {
      return `Server data is not configured for ${resourceLabel}.`;
    }

    return `Failed to load ${resourceLabel}: ${error.message}`;
  }

  if (error instanceof Error) {
    return `Failed to load ${resourceLabel}: ${error.message}`;
  }

  return `Failed to load ${resourceLabel}.`;
};

export const apiClient = {
  getMetaVersion: () => getCachedMetaVersion(),
  getMonster: (id: string) => getJson(`/api/monsters/${id}`, monsterSchema),
  getMonsters: () =>
    getCollectionWithPersistentCache(
      STORAGE_KEYS.monsters,
      "/api/monsters",
      monsterSchema,
      (version) => version.monstersVersion
    ),
  getSpell: (id: string) => getJson(`/api/spells/${id}`, spellSchema),
  getSpells: () =>
    getCollectionWithPersistentCache(
      STORAGE_KEYS.spells,
      "/api/spells",
      spellSchema,
      (version) => version.spellsVersion
    ),
};
