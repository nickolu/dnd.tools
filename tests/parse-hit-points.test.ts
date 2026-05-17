import { describe, expect, it } from "vitest";

import { parseHitPoints } from "@/lib/domain/encounter/utils/parseHitPoints";

describe("parseHitPoints", () => {
  it("extracts leading integer from '45 (7d10 + 14)'", () => {
    expect(parseHitPoints("45 (7d10 + 14)")).toBe(45);
  });

  it("returns plain integer string '10' as 10", () => {
    expect(parseHitPoints("10")).toBe(10);
  });

  it("returns 1 for empty input", () => {
    expect(parseHitPoints("")).toBe(1);
  });

  it("returns 1 for non-numeric input", () => {
    expect(parseHitPoints("abc")).toBe(1);
  });

  it("returns 1 for zero leading number (positive floor)", () => {
    expect(parseHitPoints("0 (0d0)")).toBe(1);
  });

  it("trims whitespace", () => {
    expect(parseHitPoints("  100 hp  ")).toBe(100);
  });

  it("handles large numbers", () => {
    expect(parseHitPoints("999 (40d20)")).toBe(999);
  });
});
