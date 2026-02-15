import type { SpellResultsSummaryProps } from "@/page/spells/components/spell-results-summary/types";

export function SpellResultsSummary({
  total,
  visible,
}: SpellResultsSummaryProps) {
  return (
    <p className="typography-body-sm text-muted">
      Showing {visible} of {total} spells
    </p>
  );
}
