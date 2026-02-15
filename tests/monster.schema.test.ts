import { describe, expect, it } from "vitest";

import { monsterSchema } from "@/lib/domain/monster.schema";

describe("monsterSchema", () => {
  it("accepts a minimal valid monster", () => {
    const parsed = monsterSchema.parse({
      abilityScores: { cha: 10, con: 12, dex: 14, int: 8, str: 15, wis: 11 },
      alignment: "unaligned",
      armorClass: "13",
      challengeRating: "1/2",
      createdAt: "2025-01-01T00:00:00.000Z",
      createdBy: "seed-script",
      crNumeric: 0.5,
      hitPoints: "22 (4d8+4)",
      id: "example-monster",
      isPublished: true,
      name: "Example Monster",
      nameNormalized: "example monster",
      proficiencyBonus: 2,
      schemaVersion: 1,
      size: "Medium",
      source: "homebrew",
      speed: "30 ft.",
      type: "humanoid",
      updatedAt: "2025-01-01T00:00:00.000Z",
      updatedBy: "seed-script",
    });

    expect(parsed.id).toBe("example-monster");
    expect(parsed.proficiencyBonus).toBe(2);
  });

  it("rejects invalid size", () => {
    expect(() =>
      monsterSchema.parse({
        abilityScores: { cha: 10, con: 12, dex: 14, int: 8, str: 15, wis: 11 },
        alignment: "unaligned",
        armorClass: "13",
        challengeRating: "1/2",
        createdAt: "2025-01-01T00:00:00.000Z",
        createdBy: "seed-script",
        crNumeric: 0.5,
        hitPoints: "22 (4d8+4)",
        id: "example-monster",
        isPublished: true,
        name: "Example Monster",
        nameNormalized: "example monster",
        schemaVersion: 1,
        size: "Colossal",
        source: "homebrew",
        speed: "30 ft.",
        type: "humanoid",
        updatedAt: "2025-01-01T00:00:00.000Z",
        updatedBy: "seed-script",
      })
    ).toThrow();
  });
});
