import type { MonsterResultsSummaryProps } from "@/page/monsters/components/monster-results-summary/types";

export function MonsterResultsSummary({
  activeListName,
  activeListTotal,
  isLoading = false,
  total,
  visible,
}: MonsterResultsSummaryProps) {
  if (isLoading) {
    return <p className="typography-body-sm text-muted">Loading monsters...</p>;
  }

  if (activeListName !== undefined && activeListTotal !== undefined) {
    return (
      <p className="typography-body-sm text-muted">
        Showing {visible} of {activeListTotal} in {activeListName}
      </p>
    );
  }

  return (
    <p className="typography-body-sm text-muted">
      Showing {visible} of {total} monsters
    </p>
  );
}
