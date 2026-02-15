type CollectionCacheKey = "monsters" | "spells";

type CacheEntry = {
  data: unknown;
  expiresAt: number;
  version: number;
};

const CACHE_TTL_MS = Number(process.env.API_COLLECTION_CACHE_TTL_MS ?? 300_000);

const cacheStore: Record<CollectionCacheKey, CacheEntry | null> = {
  monsters: null,
  spells: null,
};

export const getCollectionCache = (key: CollectionCacheKey) => cacheStore[key];

export const setCollectionCache = <T>(
  key: CollectionCacheKey,
  version: number,
  data: T
) => {
  cacheStore[key] = {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
    version,
  };
};

export const refreshCollectionCacheTtl = (key: CollectionCacheKey) => {
  const current = cacheStore[key];

  if (!current) {
    return;
  }

  current.expiresAt = Date.now() + CACHE_TTL_MS;
};

export const invalidateCollectionCache = (key: CollectionCacheKey) => {
  cacheStore[key] = null;
};
