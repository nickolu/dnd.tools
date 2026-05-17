import { describe, expect, it } from "vitest";

import { computeBalance } from "@/lib/domain/encounter/cr2/computeBalance";
import type {
  Combatant,
  Encounter,
  EncounterRuleset,
  PartyMember,
} from "@/lib/domain/encounter/encounter.schema";

function pc(level: number, id: string): PartyMember {
  return { id, kind: "pc", name: `PC ${level}`, level };
}

function combatant(
  id: string,
  monsterCrNumeric: number,
  side: "ally" | "enemy"
): Combatant {
  return {
    id,
    monsterId: `mid-${id}`,
    monsterName: `Monster ${id}`,
    monsterCrNumeric,
    side,
    maxHp: 10,
    currentHp: 10,
  };
}

function encounter(
  ruleset: EncounterRuleset,
  partyMembers: PartyMember[],
  combatants: Combatant[]
): Encounter {
  return {
    id: "enc-1",
    name: "Test",
    ruleset,
    partyMembers,
    combatants,
    createdAt: 0,
    updatedAt: 0,
    schemaVersion: 1,
  };
}

describe("computeBalance", () => {
  it("party of 4 level-5 PCs vs 1 CR 1 enemy (Basic)", () => {
    const enc = encounter(
      "basic",
      [pc(5, "a"), pc(5, "b"), pc(5, "c"), pc(5, "d")],
      [combatant("e1", 1, "enemy")]
    );
    const result = computeBalance(enc);

    expect(result.partyPower).toBe(128); // 4 × 32
    expect(result.encounterPower).toBe(22); // CR 1 → 22
    expect(result.tier).toBe(2);
    expect(result.hasInterpolatedEnemy).toBe(false);
    // 22 / 128 = 0.17 → well below Mild (0.40 threshold)
    expect(result.classification.bucket).toBe("Mild");
  });

  it("party of 4 level-5 PCs vs 6 CR 1 enemies (Basic) ≈ Oppressive", () => {
    const enc = encounter(
      "basic",
      [pc(5, "a"), pc(5, "b"), pc(5, "c"), pc(5, "d")],
      Array.from({ length: 6 }, (_, i) => combatant(`e${i}`, 1, "enemy"))
    );
    const result = computeBalance(enc);

    expect(result.partyPower).toBe(128);
    expect(result.encounterPower).toBe(132); // 6 × 22
    // 132 / 128 = 1.03 → between Oppressive (1.0) and Overwhelming would exist in Advanced
    // In Basic, Oppressive is highest, no Overwhelming
    expect(result.classification.bucket).toBe("Oppressive");
  });

  it("ally combatant adds to party power, not encounter power", () => {
    const enc = encounter(
      "basic",
      [pc(5, "a"), pc(5, "b"), pc(5, "c"), pc(5, "d")],
      [combatant("ally1", 1, "ally"), combatant("enemy1", 1, "enemy")]
    );
    const result = computeBalance(enc);

    expect(result.partyPower).toBe(128 + 22); // PCs + ally CR 1
    expect(result.encounterPower).toBe(22); // enemy CR 1 only
  });

  it("flags hasInterpolatedEnemy when an enemy CR is interpolated", () => {
    const enc = encounter(
      "basic",
      [pc(5, "a")],
      [combatant("e1", 7, "enemy")] // CR 7 → interpolated in Basic
    );
    expect(computeBalance(enc).hasInterpolatedEnemy).toBe(true);
  });

  it("does not flag when all enemies hit exact rows", () => {
    const enc = encounter(
      "basic",
      [pc(5, "a")],
      [combatant("e1", 1, "enemy"), combatant("e2", 2, "enemy")]
    );
    expect(computeBalance(enc).hasInterpolatedEnemy).toBe(false);
  });

  it("Advanced ruleset uses tier-dependent Monster Power", () => {
    const enc = encounter(
      "advanced",
      [pc(17, "a")], // tier 4
      [combatant("e1", 1, "enemy")]
    );
    // Advanced T4 CR 1 → 8 (vs Basic 22)
    expect(computeBalance(enc).encounterPower).toBe(8);
  });

  it("empty party with enemies → partyPower 0, highest bucket", () => {
    const enc = encounter("basic", [], [combatant("e1", 1, "enemy")]);
    const result = computeBalance(enc);
    expect(result.partyPower).toBe(0);
    expect(result.classification.bucket).toBe("Oppressive");
  });
});
