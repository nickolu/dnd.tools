import type { FilterChipProps } from "@/components/tool-widget-card/components/filter-chip/types";

export function FilterChip({
  isActive,
  label,
  sublabel,
  onClick,
}: FilterChipProps) {
  return (
    <button
      className={`filter-chip ${sublabel ? "flex flex-col items-start text-left" : ""}`}
      data-active={isActive}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      type="button"
    >
      <span>{label}</span>
      {sublabel && (
        <span className="typography-body-sm text-muted text-xs opacity-75">
          {sublabel}
        </span>
      )}
    </button>
  );
}
