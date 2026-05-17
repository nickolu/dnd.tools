import { describe, expect, it } from "vitest";

import { rollInitiative } from "@/page/encounters/utils/rollInitiative";

describe("rollInitiative", () => {
  it("returns a value within [1+mod, 20+mod] across many samples", () => {
    const mod = 3;
    for (let i = 0; i < 200; i++) {
      const v = rollInitiative(mod);
      expect(v).toBeGreaterThanOrEqual(1 + mod);
      expect(v).toBeLessThanOrEqual(20 + mod);
    }
  });

  it("handles negative modifiers", () => {
    for (let i = 0; i < 100; i++) {
      const v = rollInitiative(-2);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(18);
    }
  });

  it("zero modifier rolls in [1, 20]", () => {
    for (let i = 0; i < 100; i++) {
      const v = rollInitiative(0);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(20);
    }
  });
});
