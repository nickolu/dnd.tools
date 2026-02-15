import type { Spell } from "@/lib/domain/spell.schema";

export type SpellCardProps = {
  isAdminMode?: boolean;
  onSpellUpdated?: () => Promise<void> | void;
  spell: Spell;
};
