"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

import { useRouteTransition } from "@/components/route-transition";
import { SearchInput } from "@/components/search-input";
import { FilterChip } from "@/components/tool-widget-card/components/filter-chip";
import { useWidgetIntent } from "@/components/tool-widget-card/hooks/useWidgetIntent";
import type {
  ToolWidgetCardProps,
  WidgetIntent,
} from "@/components/tool-widget-card/types";
import { buildWidgetHref } from "@/components/tool-widget-card/utils/navigation";

export function ToolWidgetCard({
  description,
  filterOptions,
  onFilterSelect,
  onSearchChange,
  route,
  selectedFilterId,
  title,
  value,
}: ToolWidgetCardProps) {
  const router = useRouter();
  const { beginTransition } = useRouteTransition();
  const cardRef = useRef<HTMLElement | null>(null);
  const hasNavigatedRef = useRef(false);
  const { intent, setIntent } = useWidgetIntent();

  const navigateWithIntent = (nextIntent: WidgetIntent) => {
    if (hasNavigatedRef.current) {
      return;
    }

    hasNavigatedRef.current = true;
    const nextHref = buildWidgetHref(route, nextIntent);
    const rect = cardRef.current?.getBoundingClientRect();

    if (rect) {
      beginTransition({
        fromRect: {
          height: rect.height,
          width: rect.width,
          x: rect.x,
          y: rect.y,
        },
        route,
        title,
      });
    }

    router.push(nextHref);
  };

  return (
    <article
      className="surface-card block cursor-pointer p-6"
      onClick={() => {
        navigateWithIntent(intent);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        event.preventDefault();
        navigateWithIntent(intent);
      }}
      ref={cardRef}
      role="button"
      tabIndex={0}
    >
      <h2 className="typography-h1 mb-1">{title}</h2>
      {description ? (
        <p className="typography-body-sm text-secondary mb-4">{description}</p>
      ) : null}

      <div className="mb-4">
        <SearchInput
          onChange={(event) => {
            const nextValue = event.target.value;
            setIntent({ target: "search", value: nextValue });
            onSearchChange?.(nextValue);
          }}
          onClick={(event) => {
            event.stopPropagation();
          }}
          onClear={() => {
            setIntent({ target: "search", value: "" });
            onSearchChange?.("");
          }}
          onFocus={(event) => {
            const nextIntent = {
              target: "search",
              value: event.target.value,
            } as const;
            setIntent(nextIntent);
            navigateWithIntent(nextIntent);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter") {
              return;
            }

            event.preventDefault();
            event.stopPropagation();
            navigateWithIntent({
              target: "search",
              value: event.currentTarget.value,
            });
          }}
          placeholder={`Search ${title.toLowerCase()}`}
          value={value}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <FilterChip
            isActive={selectedFilterId === option.id}
            key={option.id}
            label={option.label}
            {...(option.sublabel !== undefined
              ? { sublabel: option.sublabel }
              : {})}
            onClick={() => {
              const nextIntent = {
                target: "filter",
                filterId: option.id,
              } as const;
              setIntent(nextIntent);
              onFilterSelect?.(option.id);
              navigateWithIntent(nextIntent);
            }}
          />
        ))}
      </div>
    </article>
  );
}
