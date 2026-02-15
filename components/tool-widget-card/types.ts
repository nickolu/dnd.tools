export type WidgetFilterOption = {
  id: string;
  label: string;
};

export type WidgetIntent =
  | { target: "card" }
  | { target: "search"; value: string }
  | { target: "filter"; filterId: string };

export type ToolWidgetCardProps = {
  description?: string;
  filterOptions: WidgetFilterOption[];
  onFilterSelect?: (filterId: string) => void;
  onSearchChange?: (value: string) => void;
  route: string;
  selectedFilterId: string | undefined;
  title: string;
  value: string;
};
