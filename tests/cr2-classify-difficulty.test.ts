import { describe, expect, it } from "vitest";

import { classifyDifficulty } from "@/lib/domain/encounter/cr2/classifyDifficulty";

describe("classifyDifficulty", () => {
  // partyPower = 100 makes thresholds clean:
  // Mild 40, Bruising 60, Bloody 75, Brutal 90, Oppressive 100,
  // Overwhelming 110, Crushing 130, Devastating 160, Impossible 225
  const pp = 100;

  it("below Mild threshold → Mild, no between", () => {
    const r = classifyDifficulty(pp, 30);
    expect(r.bucket).toBe("Mild");
    expect(r.between).toBeNull();
  });

  it("exactly Mild threshold → Mild, no between", () => {
    const r = classifyDifficulty(pp, 40);
    expect(r.bucket).toBe("Mild");
    expect(r.between).toBeNull();
  });

  it("between Mild and Bruising → Mild, between [Mild, Bruising]", () => {
    const r = classifyDifficulty(pp, 50);
    expect(r.bucket).toBe("Mild");
    expect(r.between).toEqual(["Mild", "Bruising"]);
  });

  it("exactly Bruising threshold → Bruising, no between", () => {
    const r = classifyDifficulty(pp, 60);
    expect(r.bucket).toBe("Bruising");
    expect(r.between).toBeNull();
  });

  it("between Bruising and Bloody → Bruising, between [Bruising, Bloody]", () => {
    const r = classifyDifficulty(pp, 70);
    expect(r.bucket).toBe("Bruising");
    expect(r.between).toEqual(["Bruising", "Bloody"]);
  });

  it("exactly Bloody threshold → Bloody", () => {
    expect(classifyDifficulty(pp, 75).bucket).toBe("Bloody");
  });

  it("exactly Brutal threshold → Brutal", () => {
    expect(classifyDifficulty(pp, 90).bucket).toBe("Brutal");
  });

  it("exactly Oppressive threshold → Oppressive, no between", () => {
    const r = classifyDifficulty(pp, 100);
    expect(r.bucket).toBe("Oppressive");
    expect(r.between).toBeNull();
  });

  it("at Oppressive threshold — between is null when exactly on boundary", () => {
    expect(classifyDifficulty(pp, 100).between).toBeNull();
  });

  it("between Oppressive and Overwhelming → Oppressive with between", () => {
    const r = classifyDifficulty(pp, 105);
    expect(r.bucket).toBe("Oppressive");
    expect(r.between).toEqual(["Oppressive", "Overwhelming"]);
  });

  it("exactly Overwhelming threshold → Overwhelming", () => {
    expect(classifyDifficulty(pp, 110).bucket).toBe("Overwhelming");
  });

  it("exactly Crushing threshold → Crushing", () => {
    expect(classifyDifficulty(pp, 130).bucket).toBe("Crushing");
  });

  it("exactly Devastating threshold → Devastating", () => {
    expect(classifyDifficulty(pp, 160).bucket).toBe("Devastating");
  });

  it("exactly Impossible threshold → Impossible (highest)", () => {
    const r = classifyDifficulty(pp, 225);
    expect(r.bucket).toBe("Impossible");
    expect(r.between).toBeNull();
  });

  it("far above Impossible → Impossible", () => {
    expect(classifyDifficulty(pp, 1000).bucket).toBe("Impossible");
  });
});
