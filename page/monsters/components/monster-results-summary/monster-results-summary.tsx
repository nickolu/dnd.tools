import type { MonsterResultsSummaryProps } from "@/page/monsters/components/monster-results-summary/types";

export function MonsterResultsSummary({
  total,
  visible,
}: MonsterResultsSummaryProps) {
  return (
    <p className="text-muted text-sm">
      Showing {visible} of {total} monsters
    </p>
  );
}
