type SpellLinkPart = {
  spellName: string;
  text: string;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildSpellLinkParts(
  text: string,
  spellNames: string[]
): Array<string | SpellLinkPart> {
  const canonicalByNormalized = new Map<string, string>();
  for (const spellName of spellNames) {
    const trimmed = spellName.trim();
    if (!trimmed) {
      continue;
    }

    const normalized = trimmed.toLowerCase();
    if (!canonicalByNormalized.has(normalized)) {
      canonicalByNormalized.set(normalized, trimmed);
    }
  }

  const normalizedSpellNames = [...canonicalByNormalized.keys()].sort(
    (left, right) => right.length - left.length
  );

  if (!normalizedSpellNames.length) {
    return [text];
  }

  const regex = new RegExp(
    `\\b(${normalizedSpellNames.map(escapeRegex).join("|")})\\b`,
    "gi"
  );

  const parts: Array<string | SpellLinkPart> = [];
  let cursor = 0;

  for (const match of text.matchAll(regex)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;

    if (start > cursor) {
      parts.push(text.slice(cursor, start));
    }

    const matchedText = text.slice(start, end);
    const normalizedMatch = matchedText.toLowerCase();
    const spellName =
      canonicalByNormalized.get(normalizedMatch) ?? matchedText.trim();

    parts.push({
      spellName,
      text: matchedText,
    });
    cursor = end;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts.length ? parts : [text];
}
