import type { Spell } from "@/lib/domain/spell.schema";
import { SPELL_LEVEL_LABELS } from "@/page/spells/components/spell-card/constants";

export function formatSpellLevelAndSchool(spell: Spell): string {
  const levelLabel = SPELL_LEVEL_LABELS[spell.level];
  return `${levelLabel} ${spell.school}`;
}

export function formatSpellComponents(spell: Spell): string {
  const components: string[] = [];

  if (spell.components.verbal) {
    components.push("V");
  }

  if (spell.components.somatic) {
    components.push("S");
  }

  if (spell.components.material) {
    components.push("M");
  }

  if (!spell.components.materialText) {
    return components.join(", ");
  }

  return `${components.join(", ")} (${spell.components.materialText})`;
}
