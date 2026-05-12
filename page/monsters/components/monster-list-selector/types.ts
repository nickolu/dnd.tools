export type MonsterListSelectorProps = {
  activeListId: string | null;
  onListSelect: (listId: string | null) => void;
};
