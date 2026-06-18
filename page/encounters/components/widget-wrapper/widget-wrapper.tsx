"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  widgetId: string;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragOver: boolean;
};

export function WidgetWrapper({
  children,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragOver,
}: Props) {
  return (
    <div
      className="relative"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
        onDragStart(index);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver(index);
      }}
      onDrop={(e) => {
        e.preventDefault();
      }}
      onDragEnd={onDragEnd}
      style={{
        borderTop: isDragOver
          ? "2px solid var(--color-accent, #4a90d9)"
          : "2px solid transparent",
        transition: "border-color 0.15s",
        cursor: "grab",
      }}
    >
      <div className="absolute right-2 top-2 z-10 flex gap-0.5">
        <span
          className="admin-button-secondary px-1 py-0.5 text-xs leading-none select-none"
          style={{ cursor: "grab" }}
          title="Drag to reorder"
          aria-hidden="true"
        >
          ⠿
        </span>
        <button
          type="button"
          className="admin-button-secondary px-1 py-0.5 text-xs leading-none"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          title="Move up"
          aria-label="Move widget up"
        >
          ▲
        </button>
        <button
          type="button"
          className="admin-button-secondary px-1 py-0.5 text-xs leading-none"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          title="Move down"
          aria-label="Move widget down"
        >
          ▼
        </button>
      </div>
      {children}
    </div>
  );
}
