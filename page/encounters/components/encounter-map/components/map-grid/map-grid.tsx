"use client";

import { memo } from "react";

type Props = {
  cols: number;
  rows: number;
  cellSize: number;
};

function MapGridImpl({ cols, rows, cellSize }: Props) {
  const width = cols * cellSize;
  const height = rows * cellSize;
  const verticals: number[] = [];
  for (let i = 0; i <= cols; i++) verticals.push(i * cellSize);
  const horizontals: number[] = [];
  for (let j = 0; j <= rows; j++) horizontals.push(j * cellSize);

  return (
    <g aria-hidden="true">
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="var(--color-surface)"
      />
      {verticals.map((x) => (
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="var(--color-border-subtle)"
          strokeWidth={1}
        />
      ))}
      {horizontals.map((y) => (
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="var(--color-border-subtle)"
          strokeWidth={1}
        />
      ))}
    </g>
  );
}

export const MapGrid = memo(MapGridImpl);
