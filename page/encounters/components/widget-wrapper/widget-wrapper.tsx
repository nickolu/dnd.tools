"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function WidgetWrapper({
  children,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: Props) {
  return (
    <div className="relative">
      <div className="absolute right-2 top-2 z-10 flex gap-0.5">
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
