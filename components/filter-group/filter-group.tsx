import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useMemo, useState } from "react";

import { FILTER_GROUP_STORAGE_PREFIX } from "@/components/filter-group/constants";
import type { FilterGroupProps } from "@/components/filter-group/types";
import { FilterChip } from "@/components/tool-widget-card/components/filter-chip";
import { cn } from "@/lib/util/cn";

export function FilterGroup({
  activeValues,
  className,
  label,
  onChange,
  options,
  selectionMode = "single",
  shouldExpand = false,
  storageKey,
}: FilterGroupProps) {
  const contentId = useId();
  const persistedKey = useMemo(
    () => `${FILTER_GROUP_STORAGE_PREFIX}:${storageKey ?? label.toLowerCase()}`,
    [label, storageKey]
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const isEffectivelyExpanded = shouldExpand || isExpanded;
  const rootClassName = className
    ? `min-w-0 space-y-1 ${className}`
    : "min-w-0 space-y-1";

  useEffect(() => {
    setHasMounted(true);
    setIsExpanded(window.localStorage.getItem(persistedKey) !== "collapsed");
  }, [persistedKey]);

  useEffect(() => {
    if (!hasMounted) {
      return;
    }

    window.localStorage.setItem(
      persistedKey,
      isEffectivelyExpanded ? "expanded" : "collapsed"
    );
  }, [hasMounted, isEffectivelyExpanded, persistedKey]);

  return (
    <section className={cn(rootClassName, 'cursor-pointer border-1 border-[#eee] rounded-md p-2')} onClick={() => {
      setIsExpanded((current) => !current);
    }}>
      <button
        aria-controls={contentId}
        aria-expanded={isEffectivelyExpanded}
        className="typography-kicker text-muted flex w-full items-center justify-start text-left cursor-pointer"
        type="button"
      >
        <span>{label}</span>
        <svg
          aria-hidden="true"
          className={`h-4 w-4 transition-transform ${isEffectivelyExpanded ? "rotate-0" : "-rotate-90"}`}
          viewBox="0 0 20 20"
        >
          <path
            d="M5 7l5 6 5-6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {isEffectivelyExpanded ? (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-wrap w-full max-w-full gap-1.5 overflow-x-auto pb-1 pt-0.5">
              {options.map((option) => (
                <FilterChip
                  isActive={activeValues.includes(option.value)}
                  key={`${label}:${option.value}`}
                  label={option.label}
                  onClick={() => {
                    if (selectionMode === "single") {
                      onChange([option.value]);
                      return;
                    }

                    if (option.value === "all") {
                      onChange(["all"]);
                      return;
                    }

                    const withoutAll = activeValues.filter(
                      (value) => value !== "all"
                    );
                    const nextValues = withoutAll.includes(option.value)
                      ? withoutAll.filter((value) => value !== option.value)
                      : [...withoutAll, option.value];

                    onChange(nextValues.length ? nextValues : ["all"]);
                  }}
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
