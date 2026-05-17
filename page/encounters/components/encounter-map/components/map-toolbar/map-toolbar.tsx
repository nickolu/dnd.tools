"use client";

import type { EncounterMap } from "@/lib/domain/encounter/encounter.schema";

import {
  CELL_SIZE_OPTIONS,
  MAX_COLS,
  MAX_ROWS,
  MIN_COLS,
  MIN_ROWS,
} from "../../constants";

type Props = {
  map: EncounterMap;
  onChange: (partial: Partial<EncounterMap>) => void;
  onClearPositions: () => void;
};

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

export function MapToolbar({ map, onChange, onClearPositions }: Props) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1">
        <span className="typography-kicker text-muted">Cols</span>
        <input
          type="number"
          inputMode="numeric"
          min={MIN_COLS}
          max={MAX_COLS}
          className="input-field typography-body-sm w-16 px-2 py-1"
          value={map.cols}
          onChange={(e) =>
            onChange({
              cols: clampInt(Number(e.target.value), MIN_COLS, MAX_COLS),
            })
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="typography-kicker text-muted">Rows</span>
        <input
          type="number"
          inputMode="numeric"
          min={MIN_ROWS}
          max={MAX_ROWS}
          className="input-field typography-body-sm w-16 px-2 py-1"
          value={map.rows}
          onChange={(e) =>
            onChange({
              rows: clampInt(Number(e.target.value), MIN_ROWS, MAX_ROWS),
            })
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="typography-kicker text-muted">Cell</span>
        <select
          className="input-field typography-body-sm px-2 py-1"
          value={map.cellSize}
          onChange={(e) =>
            onChange({ cellSize: Number.parseInt(e.target.value, 10) })
          }
        >
          {CELL_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="admin-button-secondary typography-body-sm px-3 py-1"
        onClick={onClearPositions}
      >
        Clear placements
      </button>
    </div>
  );
}
