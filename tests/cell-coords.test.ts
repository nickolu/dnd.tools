import { describe, expect, it } from "vitest";

import {
  cellToPixel,
  clampToBounds,
  isInsideGrid,
  pixelToCell,
} from "@/page/encounters/components/encounter-map/utils/cell-coords";

describe("pixelToCell", () => {
  it("floors pixel coordinates to cell indices", () => {
    expect(pixelToCell(0, 0, 48, 20, 15)).toEqual({ x: 0, y: 0 });
    expect(pixelToCell(47, 47, 48, 20, 15)).toEqual({ x: 0, y: 0 });
    expect(pixelToCell(48, 48, 48, 20, 15)).toEqual({ x: 1, y: 1 });
    expect(pixelToCell(96, 144, 48, 20, 15)).toEqual({ x: 2, y: 3 });
  });

  it("clamps negative coords to (0,0)", () => {
    expect(pixelToCell(-10, -10, 48, 20, 15)).toEqual({ x: 0, y: 0 });
  });

  it("clamps past the right/bottom edge to the last cell", () => {
    expect(pixelToCell(9999, 9999, 48, 20, 15)).toEqual({ x: 19, y: 14 });
  });

  it("returns (0,0) when cellSize is non-positive", () => {
    expect(pixelToCell(100, 100, 0, 20, 15)).toEqual({ x: 0, y: 0 });
  });
});

describe("cellToPixel", () => {
  it("returns the center pixel coordinate of a cell", () => {
    expect(cellToPixel({ x: 0, y: 0 }, 48)).toEqual({ cx: 24, cy: 24 });
    expect(cellToPixel({ x: 3, y: 4 }, 48)).toEqual({ cx: 168, cy: 216 });
  });
});

describe("clampToBounds", () => {
  it("returns the original cell when in bounds", () => {
    expect(clampToBounds({ x: 5, y: 5 }, 20, 15)).toEqual({ x: 5, y: 5 });
  });

  it("clamps negative coords to 0", () => {
    expect(clampToBounds({ x: -2, y: -3 }, 20, 15)).toEqual({ x: 0, y: 0 });
  });

  it("clamps over-bounds coords to cols-1 / rows-1", () => {
    expect(clampToBounds({ x: 99, y: 99 }, 20, 15)).toEqual({ x: 19, y: 14 });
  });
});

describe("isInsideGrid", () => {
  it("returns true for points inside the grid", () => {
    expect(isInsideGrid(0, 0, 48, 20, 15)).toBe(true);
    expect(isInsideGrid(959, 719, 48, 20, 15)).toBe(true);
  });

  it("returns false for points outside the grid", () => {
    expect(isInsideGrid(-1, 0, 48, 20, 15)).toBe(false);
    expect(isInsideGrid(0, -1, 48, 20, 15)).toBe(false);
    expect(isInsideGrid(960, 0, 48, 20, 15)).toBe(false);
    expect(isInsideGrid(0, 720, 48, 20, 15)).toBe(false);
  });
});
