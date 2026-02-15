import type { SpellFilterOption } from "@/page/spells/types";

export type SpellFilterGroupProps = {
  activeValue: string;
  className?: string;
  label: string;
  onChange: (value: string) => void;
  options: SpellFilterOption[];
};
