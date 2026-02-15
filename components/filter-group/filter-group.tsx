import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useMemo, useState } from "react";

import { FILTER_GROUP_STORAGE_PREFIX } from "@/components/filter-group/constants";
import type { FilterGroupProps } from "@/components/filter-group/types";
import { FilterChip } from "@/components/tool-widget-card/components/filter-chip";

export function FilterGroup({
  activeValue,
  className,
  label,
  onChange,
  options,
  storageKey,
}: FilterGroupProps) {
  const contentId = useId();
  const persistedKey = useMemo(
    () => `${FILTER_GROUP_STORAGE_PREFIX}:${storageKey ?? label.toLowerCase()}`,
    [label, storageKey]
  );
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.localStorage.getItem(persistedKey) !== "collapsed";
  });
  const rootClassName = className
    ? `min-w-0 space-y-1 ${className}`
    : "min-w-0 space-y-1";

  useEffect(() => {
    window.localStorage.setItem(
      persistedKey,
      isExpanded ? "expanded" : "collapsed"
    );
  }, [isExpanded, persistedKey]);

  return (
    <section className={rootClassName}>
      <button
        aria-controls={contentId}
        aria-expanded={isExpanded}
        className="typography-kicker text-muted flex w-full items-center justify-start text-left cursor-pointer"
        onClick={() => {
          setIsExpanded((current) => !current);
        }}
        type="button"
      >
        <span>{label}</span>
        <svg
          aria-hidden="true"
          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`}
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
        {isExpanded ? (
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
                  isActive={activeValue === option.value}
                  key={`${label}:${option.value}`}
                  label={option.label}
                  onClick={() => {
                    onChange(option.value);
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
