export type FilterGroupOption = {
  label: string;
  value: string;
};

export type FilterGroupProps = {
  activeValue: string;
  className?: string;
  label: string;
  onChange: (value: string) => void;
  options: FilterGroupOption[];
  storageKey?: string;
};
