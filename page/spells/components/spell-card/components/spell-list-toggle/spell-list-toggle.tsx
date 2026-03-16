"use client";

import { useSearchParams } from "next/navigation";

import { useSavedSpellListStore } from "@/lib/store/useSavedSpellListStore";

type SpellListToggleProps = {
  spellId: string;
  spellName: string;
};

export function SpellListToggle({ spellId, spellName }: SpellListToggleProps) {
  const searchParams = useSearchParams();
  const listIdParam = searchParams.get("list");

  const activeList = useSavedSpellListStore((s) =>
    listIdParam ? (s.lists.find((l) => l.id === listIdParam) ?? null) : null
  );

  const toggleSpell = useSavedSpellListStore((s) => s.toggleSpellInActiveList);

  // Don't render if no list is active
  if (!listIdParam || !activeList) return null;

  const isInList = activeList.spellIds.includes(spellId);
  const label = isInList
    ? `Remove ${spellName} from ${activeList.name}`
    : `Add ${spellName} to ${activeList.name}`;

  return (
    <button
      aria-label={label}
      aria-pressed={isInList}
      className="spell-list-toggle"
      data-active={isInList}
      onClick={() => toggleSpell(activeList.id, spellId)}
      title={label}
      type="button"
    >
      {isInList ? (
        // Filled bookmark SVG
        <svg
          aria-hidden="true"
          fill="currentColor"
          height="16"
          viewBox="0 0 24 24"
          width="16"
        >
          <path d="M5 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-4-7 4V3Z" />
        </svg>
      ) : (
        // Outline bookmark SVG
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          width="16"
        >
          <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
      )}
    </button>
  );
}
