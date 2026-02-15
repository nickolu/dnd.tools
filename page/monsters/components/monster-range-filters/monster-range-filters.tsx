"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { FILTER_GROUP_STORAGE_PREFIX } from "@/components/filter-group/constants";
import {
  MONSTER_RANGE_FILTERS_STORAGE_KEY,
  RANGE_SELECT_EMPTY_VALUE,
} from "@/page/monsters/components/monster-range-filters/constants";
import type { MonsterRangeFiltersProps } from "@/page/monsters/components/monster-range-filters/types";

export function MonsterRangeFilters({
  formatValue,
  items,
}: MonsterRangeFiltersProps) {
  const contentId = useId();
  const persistedKey = useMemo(
    () => `${FILTER_GROUP_STORAGE_PREFIX}:${MONSTER_RANGE_FILTERS_STORAGE_KEY}`,
    []
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const hasHydratedPersistedState = useRef(false);

  useEffect(() => {
    setIsExpanded(window.localStorage.getItem(persistedKey) !== "collapsed");
    hasHydratedPersistedState.current = true;
  }, [persistedKey]);

  useEffect(() => {
    if (!hasHydratedPersistedState.current) {
      return;
    }

    window.localStorage.setItem(
      persistedKey,
      isExpanded ? "expanded" : "collapsed"
    );
  }, [isExpanded, persistedKey]);

  return (
    <section className="space-y-2">
      <button
        aria-controls={contentId}
        aria-expanded={isExpanded}
        className="typography-kicker text-muted flex w-full items-center justify-start text-left cursor-pointer"
        onClick={() => {
          setIsExpanded((current) => !current);
        }}
        type="button"
      >
        <span>Numeric Ranges</span>
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
            <div className="grid gap-2 md:grid-cols-3">
              {items.map((item) => {
                const minChoices = item.options.filter(
                  (value) => item.max === null || value <= item.max
                );
                const maxChoices = item.options.filter(
                  (value) => item.min === null || value >= item.min
                );

                return (
                  <div
                    className="flex items-center justify-between gap-2"
                    key={item.key}
                  >
                    <p className="typography-body-sm text-secondary min-w-0">
                      {item.label}
                    </p>
                    <div className="flex shrink-0 items-center gap-1">
                      {item.key === "hitPoints" ? (
                        <>
                          <input
                            className="input-field w-20 px-1.5 py-1 typography-body-sm"
                            inputMode="numeric"
                            min={0}
                            onChange={(event) => {
                              const next = event.target.value;
                              item.onMinChange(
                                next === RANGE_SELECT_EMPTY_VALUE
                                  ? null
                                  : Number(next)
                              );
                            }}
                            placeholder="Min"
                            type="number"
                            value={item.min ?? RANGE_SELECT_EMPTY_VALUE}
                          />
                          <input
                            className="input-field w-20 px-1.5 py-1 typography-body-sm"
                            inputMode="numeric"
                            min={0}
                            onChange={(event) => {
                              const next = event.target.value;
                              item.onMaxChange(
                                next === RANGE_SELECT_EMPTY_VALUE
                                  ? null
                                  : Number(next)
                              );
                            }}
                            placeholder="Max"
                            type="number"
                            value={item.max ?? RANGE_SELECT_EMPTY_VALUE}
                          />
                        </>
                      ) : (
                        <>
                          <select
                            className="input-field w-20 px-1.5 py-1 typography-body-sm"
                            onChange={(event) => {
                              const next = event.target.value;
                              item.onMinChange(
                                next === RANGE_SELECT_EMPTY_VALUE
                                  ? null
                                  : Number(next)
                              );
                            }}
                            value={item.min ?? RANGE_SELECT_EMPTY_VALUE}
                          >
                            <option value={RANGE_SELECT_EMPTY_VALUE}>
                              Min
                            </option>
                            {minChoices.map((value) => (
                              <option
                                key={`${item.key}:min:${value}`}
                                value={value}
                              >
                                {formatValue(item.key, value)}
                              </option>
                            ))}
                          </select>
                          <select
                            className="input-field w-20 px-1.5 py-1 typography-body-sm"
                            onChange={(event) => {
                              const next = event.target.value;
                              item.onMaxChange(
                                next === RANGE_SELECT_EMPTY_VALUE
                                  ? null
                                  : Number(next)
                              );
                            }}
                            value={item.max ?? RANGE_SELECT_EMPTY_VALUE}
                          >
                            <option value={RANGE_SELECT_EMPTY_VALUE}>
                              Max
                            </option>
                            {maxChoices.map((value) => (
                              <option
                                key={`${item.key}:max:${value}`}
                                value={value}
                              >
                                {formatValue(item.key, value)}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
