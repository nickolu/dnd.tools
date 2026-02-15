import type { FilterGroupSelectionMode } from "@/components/filter-group";

export type FilterLogicMatchMode = "and" | "or";

export type FilterLogicGroup = {
  key: string;
  label: string;
  matchMode: FilterLogicMatchMode;
  onMatchModeChange: (mode: FilterLogicMatchMode) => void;
  onSelectionModeChange: (mode: FilterGroupSelectionMode) => void;
  selectionMode: FilterGroupSelectionMode;
};

export type FilterLogicPopoverProps = {
  globalMatchMode: FilterLogicMatchMode;
  groups: FilterLogicGroup[];
  onGlobalMatchModeChange: (mode: FilterLogicMatchMode) => void;
};
