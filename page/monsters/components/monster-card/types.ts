import type { Monster } from "@/lib/domain/monster.schema";

export type MonsterCardProps = {
  isAdminMode?: boolean;
  monster: Monster;
};
