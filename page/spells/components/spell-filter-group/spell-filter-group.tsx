import { FilterChip } from "@/components/tool-widget-card/components/filter-chip";
import type { SpellFilterGroupProps } from "@/page/spells/components/spell-filter-group/types";

export function SpellFilterGroup({
  activeValue,
  className,
  label,
  onChange,
  options,
}: SpellFilterGroupProps) {
  const rootClassName = className
    ? `min-w-0 space-y-1 ${className}`
    : "min-w-0 space-y-1";

  return (
    <section className={rootClassName}>
      <h3 className="text-muted text-[0.7rem] font-semibold uppercase tracking-[0.08em]">
        {label}
      </h3>
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
