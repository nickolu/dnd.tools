import type { Spell } from "@/lib/domain/spell.schema";
import {
  isSpellDamageTypeFilter,
  SPELL_DAMAGE_TYPE_VALUES,
} from "@/page/spells/constants";
import type { SpellDamageTypeFilter } from "@/page/spells/types";

function hasDamageTypeToken(
  value: string,
  token: SpellDamageTypeFilter
): boolean {
  if (token === "non-magical") {
    return /\bnon[\s-]?magical\b/i.test(value);
  }

  return new RegExp(`\\b${token}\\b`, "i").test(value);
}

export function parseSpellDamageTypes(
  value: string | null | undefined
): SpellDamageTypeFilter[] {
  if (!value) {
    return [];
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return SPELL_DAMAGE_TYPE_VALUES.filter((token) =>
    hasDamageTypeToken(normalized, token)
  );
}

export function normalizeSpellDamageTypeFilterValue(
  value: string
): SpellDamageTypeFilter | null {
  const normalized = value.trim().toLowerCase();
  if (/\bnon[\s-]?magical\b/i.test(normalized)) {
    return "non-magical";
  }

  return isSpellDamageTypeFilter(normalized) ? normalized : null;
}

export function getSpellDamageTypes(spell: Spell): SpellDamageTypeFilter[] {
  return parseSpellDamageTypes(spell.damage?.type);
}
