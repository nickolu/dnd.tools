import type {
  Combatant,
  CombatantSide,
} from "@/lib/domain/encounter/encounter.schema";

export type CombatantGroup = {
  monsterId: string;
  monsterName: string;
  side: CombatantSide;
  combatants: Combatant[];
};
