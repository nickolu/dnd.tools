type SearchParamsReader = {
  getAll: (key: string) => string[];
  has: (key: string) => boolean;
};

function getUniqueKeys(keys: string[]): string[] {
  return [...new Set(keys)];
}

export function hasAnyFilterQueryParam(
  searchParams: SearchParamsReader,
  filterQueryKeys: string[]
): boolean {
  return getUniqueKeys(filterQueryKeys).some((key) => searchParams.has(key));
}

export function extractFilterQueryParams(
  searchParams: SearchParamsReader,
  filterQueryKeys: string[]
): URLSearchParams {
  const extracted = new URLSearchParams();

  for (const key of getUniqueKeys(filterQueryKeys)) {
    const values = searchParams.getAll(key);
    for (const value of values) {
      extracted.append(key, value);
    }
  }

  return extracted;
}

export function persistFilterQueryParams(
  storageKey: string,
  searchParams: SearchParamsReader,
  filterQueryKeys: string[]
) {
  const filteredParams = extractFilterQueryParams(
    searchParams,
    filterQueryKeys
  );
  const serialized = filteredParams.toString();

  if (!serialized) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, serialized);
}

export function readPersistedFilterQueryParams(
  storageKey: string
): URLSearchParams | null {
  const serialized = window.localStorage.getItem(storageKey);
  if (!serialized) {
    return null;
  }

  return new URLSearchParams(serialized);
}

export function applyPersistedFilterQueryParams(
  currentParams: URLSearchParams,
  persistedParams: URLSearchParams,
  filterQueryKeys: string[]
): URLSearchParams {
  const nextParams = new URLSearchParams(currentParams.toString());

  for (const key of getUniqueKeys(filterQueryKeys)) {
    nextParams.delete(key);
    for (const value of persistedParams.getAll(key)) {
      nextParams.append(key, value);
    }
  }

  return nextParams;
}

export function clearFilterQueryParams(
  params: URLSearchParams,
  filterQueryKeys: string[]
) {
  for (const key of getUniqueKeys(filterQueryKeys)) {
    params.delete(key);
  }
}
