import type { FilterGroupProps } from "@/components/filter-group/types";
import { FilterChip } from "@/components/tool-widget-card/components/filter-chip";

export function FilterGroup({
  activeValue,
  className,
  label,
  onChange,
  options,
}: FilterGroupProps) {
  const rootClassName = className
    ? `min-w-0 space-y-1 ${className}`
    : "min-w-0 space-y-1";

  return (
    <section className={rootClassName}>
      <h3 className="typography-kicker text-muted">{label}</h3>
      <div className="flex flex-wrap w-full max-w-full gap-1.5 overflow-x-auto pb-1">
        {options.map((option) => (
          <FilterChip
            isActive={activeValue === option.value}
            key={`${label}:${option.value}`}
            label={option.label}
            onClick={() => {
              onChange(option.value);
            }}
          />
        ))}
      </div>
    </section>
  );
}
