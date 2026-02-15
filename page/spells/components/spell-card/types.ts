import type { Spell } from "@/lib/domain/spell.schema";

export type SpellCardProps = {
  isAdminMode?: boolean;
  spell: Spell;
};
