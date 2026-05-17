import { describe, expect, it } from "vitest";

import { dexModifier } from "@/page/encounters/utils/dexMod";

describe("dexModifier", () => {
  it("dex 10 → 0", () => {
    expect(dexModifier(10)).toBe(0);
  });

  it("dex 8 → -1", () => {
    expect(dexModifier(8)).toBe(-1);
  });

  it("dex 20 → 5", () => {
    expect(dexModifier(20)).toBe(5);
  });

  it("dex 1 → -5", () => {
    expect(dexModifier(1)).toBe(-5);
  });

  it("dex 11 → 0 (rounds down)", () => {
    expect(dexModifier(11)).toBe(0);
  });

  it("dex 12 → 1", () => {
    expect(dexModifier(12)).toBe(1);
  });

  it("non-finite input → 0", () => {
    expect(dexModifier(Number.NaN)).toBe(0);
    expect(dexModifier(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
