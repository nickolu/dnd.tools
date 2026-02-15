"use client";

import { useEffect, useRef, useState } from "react";

import { FILTER_LOGIC_POPOVER_LABELS } from "@/components/filter-logic-popover/constants";
import type { FilterLogicPopoverProps } from "@/components/filter-logic-popover/types";

export function FilterLogicPopover({
  globalMatchMode,
  groups,
  onGlobalMatchModeChange,
}: FilterLogicPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isOpen]);

  return (
    <div className="filter-logic-popover" ref={popoverRef}>
      <button
        aria-label="Open filter logic options"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="filter-logic-trigger"
        data-open={isOpen}
        onClick={() => {
          setIsOpen((current) => !current);
        }}
        type="button"
      >
        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M4 7h16M7 12h10M10 17h4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
        <span className="sr-only">Filter Logic</span>
      </button>
      {isOpen ? (
        <div className="filter-logic-popover-panel surface-card" role="dialog">
          <div className="mt-2 space-y-2 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="typography-body-sm text-secondary">
                Across groups
              </span>
              <button
                className="filter-chip cursor-pointer"
                data-active={globalMatchMode === "and"}
                onClick={() => {
                  onGlobalMatchModeChange("and");
                }}
                type="button"
              >
                {FILTER_LOGIC_POPOVER_LABELS.and}
              </button>
              <button
                className="filter-chip cursor-pointer"
                data-active={globalMatchMode === "or"}
                onClick={() => {
                  onGlobalMatchModeChange("or");
                }}
                type="button"
              >
                {FILTER_LOGIC_POPOVER_LABELS.or}
              </button>
            </div>

            {groups.map((group) => (
              <div
                className="flex flex-wrap items-center gap-2"
                key={group.key}
              >
                <span className="typography-body-sm text-secondary capitalize">
                  {group.label}
                </span>
                <button
                  className="filter-chip cursor-pointer"
                  data-active={group.selectionMode === "single"}
                  onClick={() => {
                    group.onSelectionModeChange("single");
                  }}
                  type="button"
                >
                  {FILTER_LOGIC_POPOVER_LABELS.single}
                </button>
                <button
                  className="filter-chip cursor-pointer"
                  data-active={group.selectionMode === "multi"}
                  onClick={() => {
                    group.onSelectionModeChange("multi");
                  }}
                  type="button"
                >
                  {FILTER_LOGIC_POPOVER_LABELS.multi}
                </button>
                {group.selectionMode === "multi" ? (
                  <>
                    <span className="typography-body-sm text-secondary">
                      within
                    </span>
                    <button
                      className="filter-chip cursor-pointer"
                      data-active={group.matchMode === "or"}
                      onClick={() => {
                        group.onMatchModeChange("or");
                      }}
                      type="button"
                    >
                      {FILTER_LOGIC_POPOVER_LABELS.or}
                    </button>
                    <button
                      className="filter-chip cursor-pointer"
                      data-active={group.matchMode === "and"}
                      onClick={() => {
                        group.onMatchModeChange("and");
                      }}
                      type="button"
                    >
                      {FILTER_LOGIC_POPOVER_LABELS.and}
                    </button>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
