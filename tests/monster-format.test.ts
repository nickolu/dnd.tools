import { describe, expect, it } from "vitest";

import {
  formatSkillBonuses,
  inferProficiencyBonus,
} from "@/page/monsters/components/monster-card/utils/formatMonster";

describe("monster formatting helpers", () => {
  it("formats skills with signed bonuses", () => {
    expect(
      formatSkillBonuses({
        athletics: 4,
        "sleight of hand": 3,
        stealth: 6,
      })
    ).toBe("Athletics +4, Sleight Of Hand +3, Stealth +6");
  });

  it("infers proficiency bonus from CR", () => {
    expect(inferProficiencyBonus(0.25)).toBe(2);
    expect(inferProficiencyBonus(5)).toBe(3);
    expect(inferProficiencyBonus(17)).toBe(6);
    expect(inferProficiencyBonus(30)).toBe(9);
  });
});
