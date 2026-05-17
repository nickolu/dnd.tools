"use client";

import type { PointerEvent as ReactPointerEvent } from "react";

import type { TokenViewModel } from "../../types";
import { cellToPixel } from "../../utils/cell-coords";

type Props = {
  token: TokenViewModel;
  cell: { x: number; y: number };
  cellSize: number;
  isSelected: boolean;
  isDragging: boolean;
  onPointerDown: (e: ReactPointerEvent<SVGGElement>) => void;
};

const SIDE_FILL: Record<TokenViewModel["side"], string> = {
  pc: "var(--color-focus-ring)",
  ally: "var(--color-accent)",
  enemy: "var(--color-danger)",
};

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "?";
  return trimmed.charAt(0).toUpperCase();
}

export function Token({
  token,
  cell,
  cellSize,
  isSelected,
  isDragging,
  onPointerDown,
}: Props) {
  const { cx, cy } = cellToPixel(cell, cellSize);
  const radius = cellSize * 0.4;
  const fill = SIDE_FILL[token.side];

  const hpRatio =
    token.currentHp !== null && token.maxHp !== null && token.maxHp > 0
      ? Math.max(0, Math.min(1, token.currentHp / token.maxHp))
      : null;

  const hpBarWidth = cellSize * 0.7;
  const hpBarHeight = 3;
  const hpBarX = cx - hpBarWidth / 2;
  const hpBarY = cy + radius + 2;

  const ariaLabel =
    token.maxHp !== null && token.currentHp !== null
      ? `${token.name}, ${token.currentHp}/${token.maxHp} HP, row ${cell.y + 1} col ${cell.x + 1}`
      : `${token.name}, row ${cell.y + 1} col ${cell.x + 1}`;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      onPointerDown={onPointerDown}
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={fill}
        stroke={isSelected ? "var(--color-accent)" : "var(--color-canvas)"}
        strokeWidth={isSelected ? 3 : 2}
      />
      <text
        x={cx}
        y={cy + radius * 0.35}
        textAnchor="middle"
        fontSize={radius}
        fontWeight={700}
        fill="var(--color-accent-contrast)"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {getInitial(token.name)}
      </text>
      {hpRatio !== null ? (
        <g aria-hidden="true">
          <rect
            x={hpBarX}
            y={hpBarY}
            width={hpBarWidth}
            height={hpBarHeight}
            fill="var(--color-border-subtle)"
            rx={1.5}
          />
          <rect
            x={hpBarX}
            y={hpBarY}
            width={hpBarWidth * hpRatio}
            height={hpBarHeight}
            fill={
              hpRatio > 0.5
                ? "var(--color-focus-ring)"
                : hpRatio > 0.25
                  ? "var(--color-accent)"
                  : "var(--color-danger)"
            }
            rx={1.5}
          />
        </g>
      ) : null}
    </g>
  );
}
