import { describe, expect, it } from "vitest";

import { computeMonsterPower } from "@/lib/domain/encounter/cr2/computeMonsterPower";

describe("computeMonsterPower", () => {
  it("CR 1 at tier 1 → 22", () => {
    expect(computeMonsterPower(1, 1)).toEqual({
      power: 22,
      isInterpolated: false,
    });
  });

  it("CR 1 at tier 4 → 8 (tier dispatch)", () => {
    expect(computeMonsterPower(1, 4)).toEqual({
      power: 8,
      isInterpolated: false,
    });
  });

  it("CR 0 at tier 3 → 0 (tier zero entry)", () => {
    expect(computeMonsterPower(0, 3)).toEqual({
      power: 0,
      isInterpolated: false,
    });
  });

  it("CR 5 at tier 2 → 60", () => {
    expect(computeMonsterPower(5, 2)).toEqual({
      power: 60,
      isInterpolated: false,
    });
  });

  it("interpolates CR 0.25 between CR 0.125 (3) and CR 0.5 (12) at tier 2", () => {
    const result = computeMonsterPower(0.25, 2);
    // t = (0.25 - 0.125) / (0.5 - 0.125) = 0.333; 3 + 0.333*(12-3) = 6
    expect(result.power).toBe(6);
    expect(result.isInterpolated).toBe(true);
  });

  it("clamps CR 30 to highest known Advanced row (CR 10) and flags interpolated", () => {
    const result = computeMonsterPower(30, 4);
    expect(result.power).toBe(60);
    expect(result.isInterpolated).toBe(true);
  });

  it("clamps CR below 0 to the lowest known row and flags interpolated", () => {
    const result = computeMonsterPower(-1, 1);
    expect(result.power).toBe(1);
    expect(result.isInterpolated).toBe(true);
  });
});
