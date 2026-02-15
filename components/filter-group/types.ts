export type FilterGroupOption = {
  label: string;
  value: string;
};

export type FilterGroupSelectionMode = "single" | "multi";

export type FilterGroupProps = {
  activeValues: string[];
  className?: string;
  label: string;
  onChange: (values: string[]) => void;
  options: FilterGroupOption[];
  selectionMode?: FilterGroupSelectionMode;
  storageKey?: string;
};
