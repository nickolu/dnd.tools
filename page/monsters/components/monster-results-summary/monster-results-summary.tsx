import type { MonsterResultsSummaryProps } from "@/page/monsters/components/monster-results-summary/types";

export function MonsterResultsSummary({
  isLoading = false,
  total,
  visible,
}: MonsterResultsSummaryProps) {
  if (isLoading) {
    return <p className="typography-body-sm text-muted">Loading monsters...</p>;
  }

  return (
    <p className="typography-body-sm text-muted">
      Showing {visible} of {total} monsters
    </p>
  );
}
