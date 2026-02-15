import type { MonsterRangeFilterKey } from "@/page/monsters/types";

export type MonsterRangeFilterItem = {
  key: MonsterRangeFilterKey;
  label: string;
  max: number | null;
  min: number | null;
  onMaxChange: (value: number | null) => void;
  onMinChange: (value: number | null) => void;
  options: number[];
};

export type MonsterRangeFiltersProps = {
  formatValue: (key: MonsterRangeFilterKey, value: number) => string;
  items: MonsterRangeFilterItem[];
};
