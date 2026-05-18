import type { SpellAggregateGrouping } from "./types";

export const GROUPING_OPTIONS: readonly SpellAggregateGrouping[] = [
  "level",
  "school",
];

export const GROUPING_LABEL: Record<SpellAggregateGrouping, string> = {
  level: "By level",
  school: "By school",
};

export const GROUPING_STORAGE_KEY =
  "dnd-tools-encounter-spell-aggregate-grouping";

export const DEFAULT_GROUPING: SpellAggregateGrouping = "level";

export type SpellViewMode = "list" | "table";
export const VIEW_MODE_STORAGE_KEY = "dnd-tools-encounter-spell-aggregate-view";
export const DEFAULT_VIEW_MODE: SpellViewMode = "list";
