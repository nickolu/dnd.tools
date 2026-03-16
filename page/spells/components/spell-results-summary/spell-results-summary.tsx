import type { SpellResultsSummaryProps } from "@/page/spells/components/spell-results-summary/types";

export function SpellResultsSummary({
  activeListName,
  activeListTotal,
  isLoading = false,
  total,
  visible,
}: SpellResultsSummaryProps) {
  if (isLoading) {
    return <p className="typography-body-sm text-muted">Loading spells...</p>;
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
      Showing {visible} of {total} spells
    </p>
  );
}
