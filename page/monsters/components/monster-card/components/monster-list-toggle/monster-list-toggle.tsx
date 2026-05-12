"use client";

import { useEffect, useRef, useState } from "react";

import { useSavedMonsterListStore } from "@/lib/store/useSavedMonsterListStore";

type MonsterListToggleProps = {
  monsterId: string;
  monsterName: string;
};

export function MonsterListToggle({
  monsterId,
  monsterName,
}: MonsterListToggleProps) {
  const lists = useSavedMonsterListStore((s) => s.lists);
  const addMonsterToList = useSavedMonsterListStore((s) => s.addMonsterToList);
  const removeMonsterFromList = useSavedMonsterListStore(
    (s) => s.removeMonsterFromList
  );
  const createList = useSavedMonsterListStore((s) => s.createList);

  const [isOpen, setIsOpen] = useState(false);
  const [newListName, setNewListName] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const newListInputRef = useRef<HTMLInputElement>(null);

  const isInAnyList = lists.some((l) => l.monsterIds.includes(monsterId));

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isOpen]);

  // Focus first item or new-list input on open
  useEffect(() => {
    if (!isOpen) return;

    if (lists.length > 0) {
      firstItemRef.current?.focus();
    } else {
      newListInputRef.current?.focus();
    }
  }, [isOpen, lists.length]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    setNewListName("");
  };

  const handleListClick = (listId: string, isInList: boolean) => {
    if (isInList) {
      removeMonsterFromList(listId, monsterId);
    } else {
      addMonsterToList(listId, monsterId);
    }
  };

  const handleCreateAndAdd = () => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    const newId = createList(trimmed);
    if (newId) {
      addMonsterToList(newId, monsterId);
    }
    setNewListName("");
    setIsOpen(false);
  };

  const triggerLabel = isInAnyList
    ? `${monsterName} is saved to a list`
    : `Save ${monsterName} to a list`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={triggerLabel}
        className="spell-list-toggle"
        data-active={isInAnyList}
        onClick={handleToggle}
        ref={triggerRef}
        title={triggerLabel}
        type="button"
      >
        {isInAnyList ? (
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

      {isOpen ? (
        <div
          className="filter-logic-popover-panel surface-card"
          role="menu"
          style={{
            right: 0,
            left: "auto",
            minWidth: "14rem",
          }}
        >
          <div className="p-2">
            {lists.length > 0 ? (
              <>
                <p
                  className="typography-kicker px-3 py-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Save to list
                </p>
                {lists.map((list, index) => {
                  const isInList = list.monsterIds.includes(monsterId);
                  return (
                    <button
                      aria-checked={isInList}
                      className="typography-body-sm flex w-full items-center gap-2 rounded px-3 py-2 text-left transition-colors"
                      key={list.id}
                      onClick={() => handleListClick(list.id, isInList)}
                      ref={index === 0 ? firstItemRef : undefined}
                      role="menuitemcheckbox"
                      style={{
                        background: "transparent",
                        color: "var(--color-text-primary)",
                      }}
                      type="button"
                    >
                      <span
                        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded"
                        style={{
                          border: isInList
                            ? "none"
                            : "1px solid var(--color-border-strong)",
                          background: isInList
                            ? "var(--color-accent)"
                            : "transparent",
                          color: isInList
                            ? "var(--color-accent-contrast)"
                            : "transparent",
                        }}
                      >
                        {isInList ? (
                          <svg
                            aria-hidden="true"
                            fill="none"
                            height="10"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                            width="10"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {list.name}
                      </span>
                      <span
                        className="typography-kicker shrink-0"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {list.monsterIds.length}
                      </span>
                    </button>
                  );
                })}
                <div
                  className="my-2 border-t"
                  style={{ borderColor: "var(--color-border-subtle)" }}
                />
              </>
            ) : null}

            {/* New list section */}
            <div className="flex items-center gap-2 px-1">
              <input
                className="input-field typography-body-sm min-w-0 flex-1 px-2 py-1"
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateAndAdd();
                  }
                }}
                placeholder="New list..."
                ref={newListInputRef}
                type="text"
                value={newListName}
              />
              <button
                className="admin-button-secondary typography-body-sm shrink-0 px-2 py-1"
                disabled={!newListName.trim()}
                onClick={handleCreateAndAdd}
                type="button"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
