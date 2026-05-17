import { describe, expect, it } from "vitest";

import { classifyDifficulty } from "@/lib/domain/encounter/cr2/classifyDifficulty";

describe("classifyDifficulty — Basic ruleset", () => {
  // partyPower = 100 makes thresholds clean: Mild 40, Bruising 60, Bloody 75, Brutal 90, Oppressive 100
  const pp = 100;

  it("below Mild threshold → Mild, no between", () => {
    const r = classifyDifficulty(pp, 30, "basic");
    expect(r.bucket).toBe("Mild");
    expect(r.between).toBeNull();
  });

  it("exactly Mild threshold → Mild, no between", () => {
    const r = classifyDifficulty(pp, 40, "basic");
    expect(r.bucket).toBe("Mild");
    expect(r.between).toBeNull();
  });

  it("between Mild and Bruising → Mild, between [Mild, Bruising]", () => {
    const r = classifyDifficulty(pp, 50, "basic");
    expect(r.bucket).toBe("Mild");
    expect(r.between).toEqual(["Mild", "Bruising"]);
  });

  it("exactly Bruising threshold → Bruising, no between", () => {
    const r = classifyDifficulty(pp, 60, "basic");
    expect(r.bucket).toBe("Bruising");
    expect(r.between).toBeNull();
  });

  it("between Bruising and Bloody → Bruising, between [Bruising, Bloody]", () => {
    const r = classifyDifficulty(pp, 70, "basic");
    expect(r.bucket).toBe("Bruising");
    expect(r.between).toEqual(["Bruising", "Bloody"]);
  });

  it("exactly Bloody threshold → Bloody", () => {
    expect(classifyDifficulty(pp, 75, "basic").bucket).toBe("Bloody");
  });

  it("exactly Brutal threshold → Brutal", () => {
    expect(classifyDifficulty(pp, 90, "basic").bucket).toBe("Brutal");
  });

  it("exactly Oppressive threshold → Oppressive (highest), no between", () => {
    const r = classifyDifficulty(pp, 100, "basic");
    expect(r.bucket).toBe("Oppressive");
    expect(r.between).toBeNull();
  });

  it("far above Oppressive → Oppressive (highest), no between", () => {
    const r = classifyDifficulty(pp, 500, "basic");
    expect(r.bucket).toBe("Oppressive");
    expect(r.between).toBeNull();
  });

  it("Basic ruleset never returns Advanced extras", () => {
    const r = classifyDifficulty(pp, 200, "basic");
    expect(r.bucket).toBe("Oppressive");
  });
});

describe("classifyDifficulty — Advanced ruleset", () => {
  const pp = 100;
  // Advanced extras: Overwhelming 110, Crushing 130, Devastating 160, Impossible 225

  it("at Oppressive threshold → Oppressive, between [Oppressive, Overwhelming] when strictly between", () => {
    // Exactly 100 = Oppressive threshold: bucket is Oppressive, between null
    expect(classifyDifficulty(pp, 100, "advanced").between).toBeNull();
  });

  it("between Oppressive and Overwhelming → Oppressive with between", () => {
    const r = classifyDifficulty(pp, 105, "advanced");
    expect(r.bucket).toBe("Oppressive");
    expect(r.between).toEqual(["Oppressive", "Overwhelming"]);
  });

  it("exactly Overwhelming threshold → Overwhelming", () => {
    expect(classifyDifficulty(pp, 110, "advanced").bucket).toBe("Overwhelming");
  });

  it("exactly Crushing threshold → Crushing", () => {
    expect(classifyDifficulty(pp, 130, "advanced").bucket).toBe("Crushing");
  });

  it("exactly Devastating threshold → Devastating", () => {
    expect(classifyDifficulty(pp, 160, "advanced").bucket).toBe("Devastating");
  });

  it("exactly Impossible threshold → Impossible (highest)", () => {
    const r = classifyDifficulty(pp, 225, "advanced");
    expect(r.bucket).toBe("Impossible");
    expect(r.between).toBeNull();
  });

  it("far above Impossible → Impossible", () => {
    expect(classifyDifficulty(pp, 1000, "advanced").bucket).toBe("Impossible");
  });
});
