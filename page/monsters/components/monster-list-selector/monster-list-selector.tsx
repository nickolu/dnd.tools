"use client";

import { useEffect, useRef, useState } from "react";

import { useSavedMonsterListStore } from "@/lib/store/useSavedMonsterListStore";
import type { MonsterListSelectorProps } from "@/page/monsters/components/monster-list-selector/types";

export function MonsterListSelector({
  activeListId,
  onListSelect,
}: MonsterListSelectorProps) {
  const lists = useSavedMonsterListStore((s) => s.lists);
  const createList = useSavedMonsterListStore((s) => s.createList);
  const deleteList = useSavedMonsterListStore((s) => s.deleteList);
  const renameList = useSavedMonsterListStore((s) => s.renameList);

  const [isOpen, setIsOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  const activeList = lists.find((l) => l.id === activeListId) ?? null;

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

  // Focus first item on open
  useEffect(() => {
    if (isOpen) {
      firstItemRef.current?.focus();
    }
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen((prev) => !prev);
    setConfirmDeleteId(null);
    setRenamingId(null);
    setNewListName("");
  };

  const handleSelectAll = () => {
    onListSelect(null);
    setIsOpen(false);
  };

  const handleSelectList = (listId: string) => {
    onListSelect(listId);
    setIsOpen(false);
  };

  const handleDeleteClick = (listId: string) => {
    setConfirmDeleteId(listId);
  };

  const handleDeleteConfirm = (listId: string) => {
    // If deleting the active list, clear selection
    if (listId === activeListId) {
      onListSelect(null);
    }
    deleteList(listId);
    setConfirmDeleteId(null);
  };

  const handleDeleteCancel = () => {
    setConfirmDeleteId(null);
  };

  const handleRenameClick = (listId: string, currentName: string) => {
    setRenamingId(listId);
    setRenameValue(currentName);
  };

  const handleRenameSave = (listId: string) => {
    if (renameValue.trim()) {
      renameList(listId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const handleRenameCancel = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const handleCreateList = () => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    const newId = createList(trimmed);
    if (newId) {
      onListSelect(newId);
      setIsOpen(false);
    }
    setNewListName("");
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="admin-button-secondary typography-body-sm whitespace-nowrap px-3 py-2"
        onClick={handleOpen}
        ref={triggerRef}
        type="button"
      >
        {activeList ? activeList.name : "All Monsters"}
      </button>

      {isOpen ? (
        <div
          className="filter-logic-popover-panel surface-card"
          role="listbox"
          style={{ left: 0, right: "auto" }}
        >
          <div className="p-2">
            {/* All Monsters option */}
            <button
              aria-selected={activeListId === null}
              className="typography-body-sm w-full rounded px-3 py-2 text-left transition-colors"
              data-active={activeListId === null}
              onClick={handleSelectAll}
              ref={firstItemRef}
              role="option"
              style={{
                background:
                  activeListId === null ? "var(--color-accent)" : "transparent",
                color:
                  activeListId === null
                    ? "var(--color-accent-contrast)"
                    : "var(--color-text-primary)",
              }}
              type="button"
            >
              All Monsters
            </button>

            {lists.length > 0 ? (
              <div
                className="my-2 border-t"
                style={{ borderColor: "var(--color-border-subtle)" }}
              />
            ) : null}

            {/* Saved lists */}
            {lists.map((list) => {
              const isActive = list.id === activeListId;
              const isConfirmingDelete = confirmDeleteId === list.id;
              const isRenaming = renamingId === list.id;

              if (isConfirmingDelete) {
                return (
                  <div
                    className="typography-body-sm flex items-center gap-2 px-3 py-2"
                    key={list.id}
                  >
                    <span
                      className="flex-1"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Delete &ldquo;{list.name}&rdquo;?
                    </span>
                    <button
                      className="admin-button-secondary typography-body-sm px-2 py-1"
                      onClick={() => handleDeleteConfirm(list.id)}
                      type="button"
                    >
                      Yes
                    </button>
                    <button
                      className="admin-button-secondary typography-body-sm px-2 py-1"
                      onClick={handleDeleteCancel}
                      type="button"
                    >
                      No
                    </button>
                  </div>
                );
              }

              if (isRenaming) {
                return (
                  <div
                    className="flex items-center gap-2 px-3 py-1"
                    key={list.id}
                  >
                    <input
                      autoFocus
                      className="input-field typography-body-sm min-w-0 flex-1 px-2 py-1"
                      onBlur={() => handleRenameSave(list.id)}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleRenameSave(list.id);
                        } else if (e.key === "Escape") {
                          e.stopPropagation();
                          handleRenameCancel();
                        }
                      }}
                      type="text"
                      value={renameValue}
                    />
                  </div>
                );
              }

              return (
                <div
                  aria-selected={isActive}
                  className="group flex items-center gap-1 rounded"
                  key={list.id}
                  role="option"
                  style={{
                    background: isActive
                      ? "rgba(212,160,65,0.1)"
                      : "transparent",
                  }}
                >
                  {isActive ? (
                    <span
                      className="ml-2 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: "var(--color-accent)" }}
                    />
                  ) : (
                    <span className="ml-2 h-2 w-2 shrink-0" />
                  )}
                  <button
                    className="typography-body-sm min-w-0 flex-1 truncate py-2 text-left"
                    onClick={() => handleSelectList(list.id)}
                    style={{
                      background: "transparent",
                      color: isActive
                        ? "var(--color-accent)"
                        : "var(--color-text-primary)",
                    }}
                    type="button"
                  >
                    {list.name}
                  </button>
                  <span
                    className="typography-kicker shrink-0 px-1"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {list.monsterIds.length}
                  </span>
                  <button
                    aria-label={`Rename ${list.name}`}
                    className="shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    onClick={() => handleRenameClick(list.id, list.name)}
                    style={{ color: "var(--color-text-secondary)" }}
                    type="button"
                  >
                    {/* Pencil icon */}
                    <svg
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    aria-label={`Delete ${list.name}`}
                    className="mr-1 shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    onClick={() => handleDeleteClick(list.id)}
                    style={{ color: "var(--color-text-secondary)" }}
                    type="button"
                  >
                    {/* × icon */}
                    <svg
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}

            {/* Divider before new list */}
            <div
              className="my-2 border-t"
              style={{ borderColor: "var(--color-border-subtle)" }}
            />

            {/* New list section */}
            <div className="flex items-center gap-2 px-1">
              <input
                className="input-field typography-body-sm min-w-0 flex-1 px-2 py-1"
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateList();
                  }
                }}
                placeholder="New list name"
                type="text"
                value={newListName}
              />
              <button
                className="admin-button-secondary typography-body-sm shrink-0 px-2 py-1"
                disabled={!newListName.trim()}
                onClick={handleCreateList}
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
