import { describe, expect, it } from "vitest";

import { spellSchema } from "@/lib/domain/spell.schema";

describe("spellSchema", () => {
  it("accepts a minimal valid spell", () => {
    const parsed = spellSchema.parse({
      castingTime: "1 action",
      classes: ["wizard"],
      components: {
        material: false,
        somatic: true,
        verbal: true,
      },
      concentration: false,
      createdAt: "2025-01-01T00:00:00.000Z",
      createdBy: "seed-script",
      description: ["A harmless spark appears."],
      duration: "Instantaneous",
      id: "spark",
      isPublished: true,
      level: 0,
      name: "Spark",
      nameNormalized: "spark",
      publisher: "Wizards of the Coast",
      range: "30 feet",
      ritual: false,
      schemaVersion: 1,
      school: "evocation",
      source: "homebrew",
      updatedAt: "2025-01-01T00:00:00.000Z",
      updatedBy: "seed-script",
    });

    expect(parsed.level).toBe(0);
  });

  it("rejects invalid level", () => {
    expect(() =>
      spellSchema.parse({
        castingTime: "1 action",
        classes: ["wizard"],
        components: {
          material: false,
          somatic: true,
          verbal: true,
        },
        concentration: false,
        createdAt: "2025-01-01T00:00:00.000Z",
        createdBy: "seed-script",
        description: ["A harmless spark appears."],
        duration: "Instantaneous",
        id: "spark",
        isPublished: true,
        level: 12,
        name: "Spark",
        nameNormalized: "spark",
        range: "30 feet",
        ritual: false,
        schemaVersion: 1,
        school: "evocation",
        source: "homebrew",
        updatedAt: "2025-01-01T00:00:00.000Z",
        updatedBy: "seed-script",
      })
    ).toThrow();
  });
});
