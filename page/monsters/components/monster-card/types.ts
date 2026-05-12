import type { Monster } from "@/lib/domain/monster.schema";

export type MonsterCardProps = {
  detailHref?: string;
  isAdminMode?: boolean;
  onMonsterUpdated?: () => Promise<void> | void;
  monster: Monster;
};
