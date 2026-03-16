export type SpellListSelectorProps = {
  activeListId: string | null;
  onListSelect: (listId: string | null) => void;
};
