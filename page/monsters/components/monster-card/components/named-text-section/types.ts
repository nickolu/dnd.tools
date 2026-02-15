type NamedTextEntry = {
  name: string;
  text: string;
};

export type NamedTextSectionProps = {
  entries: NamedTextEntry[];
  spellNames?: string[];
  title: string;
};
