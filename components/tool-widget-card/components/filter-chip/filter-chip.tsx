import type { FilterChipProps } from "@/components/tool-widget-card/components/filter-chip/types";

export function FilterChip({ isActive, label, onClick }: FilterChipProps) {
  return (
    <button
      className="filter-chip"
      data-active={isActive}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      type="button"
    >
      {label}
    </button>
  );
}
