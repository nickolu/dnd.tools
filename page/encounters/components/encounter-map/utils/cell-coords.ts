import type { Position } from "@/lib/domain/encounter/encounter.schema";

/**
 * Converts an SVG-space pixel coordinate to the nearest cell index by
 * floor-dividing by `cellSize`. The returned cell is clamped to the bounds
 * of the grid so the caller can use the result as a snap target.
 */
export function pixelToCell(
  pixelX: number,
  pixelY: number,
  cellSize: number,
  cols: number,
  rows: number
): Position {
  if (cellSize <= 0) return { x: 0, y: 0 };
  const rawX = Math.floor(pixelX / cellSize);
  const rawY = Math.floor(pixelY / cellSize);
  return clampToBounds({ x: rawX, y: rawY }, cols, rows);
}

/** Returns the pixel coordinate at the center of the given cell. */
export function cellToPixel(
  cell: Position,
  cellSize: number
): { cx: number; cy: number } {
  return {
    cx: cell.x * cellSize + cellSize / 2,
    cy: cell.y * cellSize + cellSize / 2,
  };
}

export function clampToBounds(
  cell: Position,
  cols: number,
  rows: number
): Position {
  const x = cell.x < 0 ? 0 : cell.x >= cols ? cols - 1 : cell.x;
  const y = cell.y < 0 ? 0 : cell.y >= rows ? rows - 1 : cell.y;
  return { x, y };
}

/** True when (px, py) is inside the grid's pixel area. */
export function isInsideGrid(
  pixelX: number,
  pixelY: number,
  cellSize: number,
  cols: number,
  rows: number
): boolean {
  return (
    pixelX >= 0 &&
    pixelY >= 0 &&
    pixelX < cellSize * cols &&
    pixelY < cellSize * rows
  );
}
