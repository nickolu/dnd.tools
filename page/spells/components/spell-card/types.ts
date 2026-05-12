import type { Spell } from "@/lib/domain/spell.schema";

export type SpellCardProps = {
  detailHref?: string;
  isAdminMode?: boolean;
  onSpellUpdated?: () => Promise<void> | void;
  spell: Spell;
};
