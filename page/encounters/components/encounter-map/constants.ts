import type { EncounterMap } from "@/lib/domain/encounter/encounter.schema";

export const MAP_DEFAULTS: EncounterMap = {
  grid: "square",
  cols: 20,
  rows: 15,
  cellSize: 48,
};

export const CELL_SIZE_OPTIONS: readonly number[] = [32, 48, 64];

export const MIN_COLS = 4;
export const MAX_COLS = 60;
export const MIN_ROWS = 4;
export const MAX_ROWS = 60;
