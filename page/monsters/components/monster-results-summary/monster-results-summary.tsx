import type { MonsterResultsSummaryProps } from "@/page/monsters/components/monster-results-summary/types";

export function MonsterResultsSummary({
  total,
  visible,
}: MonsterResultsSummaryProps) {
  return (
    <p className="typography-body-sm text-muted">
      Showing {visible} of {total} monsters
    </p>
  );
}
