import { describe, expect, it } from "vitest";

import { getPartyTier } from "@/lib/domain/encounter/cr2/getPartyTier";
import type { PartyMember } from "@/lib/domain/encounter/encounter.schema";

function pc(level: number, id = `pc-${level}`): PartyMember {
  return {
    id,
    kind: "pc",
    name: `PC ${level}`,
    level,
    initiativeMod: 0,
    initiative: null,
  };
}

describe("getPartyTier", () => {
  it("empty party → tier 1", () => {
    expect(getPartyTier([])).toBe(1);
  });

  it("all level 3 → tier 1 (max 3 ≤ 4)", () => {
    expect(getPartyTier([pc(3, "a"), pc(3, "b"), pc(3, "c")])).toBe(1);
  });

  it("max level 4 → tier 1 (boundary)", () => {
    expect(getPartyTier([pc(4)])).toBe(1);
  });

  it("max level 5 → tier 2 (boundary)", () => {
    expect(getPartyTier([pc(4, "a"), pc(5, "b")])).toBe(2);
  });

  it("max level 10 → tier 2 (boundary)", () => {
    expect(getPartyTier([pc(10)])).toBe(2);
  });

  it("max level 11 → tier 3 (boundary)", () => {
    expect(getPartyTier([pc(10, "a"), pc(11, "b")])).toBe(3);
  });

  it("max level 16 → tier 3 (boundary)", () => {
    expect(getPartyTier([pc(16)])).toBe(3);
  });

  it("max level 17 → tier 4 (boundary)", () => {
    expect(getPartyTier([pc(16, "a"), pc(17, "b")])).toBe(4);
  });

  it("max level 20 → tier 4", () => {
    expect(getPartyTier([pc(20)])).toBe(4);
  });

  it("mixed-level party uses max, not average", () => {
    // average is (3+3+3+17)/4 = 6.5 (would be tier 2), max is 17 (tier 4)
    expect(
      getPartyTier([pc(3, "a"), pc(3, "b"), pc(3, "c"), pc(17, "d")])
    ).toBe(4);
  });
});
