export function normalizeSpellRangeForFilter(value: string): string {
  const trimmed = value.trim();
  const [primary = trimmed] = trimmed.split(/\s*\(/, 1);
  return primary.trim();
}

export function normalizeSpellCastingTimeForFilter(value: string): string {
  const trimmed = value.trim();
  const [primary = trimmed] = trimmed.split(/,\s*which you take when\b/i, 1);
  return primary.trim();
}

export function normalizeSpellDurationForFilter(value: string): string {
  const trimmed = value.trim();
  const withoutConcentration = trimmed.replace(/^concentration,\s*/i, "");
  return withoutConcentration.replace(/^up to\s+/i, "").trim();
}
