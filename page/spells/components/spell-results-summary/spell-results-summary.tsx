import type { SpellResultsSummaryProps } from "@/page/spells/components/spell-results-summary/types";

export function SpellResultsSummary({
  total,
  visible,
}: SpellResultsSummaryProps) {
  return (
    <p className="text-muted text-sm">
      Showing {visible} of {total} spells
    </p>
  );
}
