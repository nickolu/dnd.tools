import { describe, expect, it } from "vitest";

import { computeBalance } from "@/lib/domain/encounter/cr2/computeBalance";
import type {
  Combatant,
  Encounter,
  PartyMember,
} from "@/lib/domain/encounter/encounter.schema";

function pc(level: number, id: string): PartyMember {
  return {
    id,
    kind: "pc",
    name: `PC ${level}`,
    level,
    initiativeMod: 0,
    initiative: null,
  };
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
    initiative: null,
    conditions: [],
  };
}

function encounter(
  partyMembers: PartyMember[],
  combatants: Combatant[]
): Encounter {
  return {
    id: "enc-1",
    name: "Test",
    ruleset: "advanced",
    partyMembers,
    combatants,
    initiative: { round: 1, activeIndex: null },
    tips: null,
    tipsGeneratedAt: null,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe("computeBalance", () => {
  it("party of 4 level-5 PCs vs 1 CR 1 enemy → Mild", () => {
    // 4 × 32 = 128 party power; tier 2, CR 1 → 17 encounter power
    const enc = encounter(
      [pc(5, "a"), pc(5, "b"), pc(5, "c"), pc(5, "d")],
      [combatant("e1", 1, "enemy")]
    );
    const result = computeBalance(enc);

    expect(result.partyPower).toBe(128); // 4 × 32
    expect(result.encounterPower).toBe(17); // CR 1 tier 2 → 17
    expect(result.tier).toBe(2);
    expect(result.hasInterpolatedEnemy).toBe(false);
    expect(result.classification.bucket).toBe("Mild");
  });

  it("party of 4 level-17 PCs vs 1 CR 1 enemy uses tier-dependent power", () => {
    const enc = encounter(
      [pc(17, "a"), pc(17, "b"), pc(17, "c"), pc(17, "d")],
      [combatant("e1", 1, "enemy")]
    );
    // Advanced T4 CR 1 → 8
    expect(computeBalance(enc).encounterPower).toBe(8);
  });

  it("ally combatant adds to party power, not encounter power", () => {
    const enc = encounter(
      [pc(5, "a"), pc(5, "b"), pc(5, "c"), pc(5, "d")],
      [combatant("ally1", 1, "ally"), combatant("enemy1", 1, "enemy")]
    );
    const result = computeBalance(enc);

    // tier 2: CR 1 ally power = 17; PC power = 128
    expect(result.partyPower).toBe(128 + 17); // PCs + ally CR 1 (tier 2)
    expect(result.encounterPower).toBe(17); // enemy CR 1 (tier 2) only
  });

  it("flags hasInterpolatedEnemy when an enemy CR is interpolated", () => {
    const enc = encounter(
      [pc(5, "a")],
      [combatant("e1", 7, "enemy")] // CR 7 → interpolated in Advanced
    );
    expect(computeBalance(enc).hasInterpolatedEnemy).toBe(true);
  });

  it("does not flag when all enemies hit exact rows", () => {
    const enc = encounter(
      [pc(5, "a")],
      [combatant("e1", 1, "enemy"), combatant("e2", 5, "enemy")]
    );
    expect(computeBalance(enc).hasInterpolatedEnemy).toBe(false);
  });

  it("empty party with enemies → partyPower 0, Impossible bucket", () => {
    const enc = encounter([], [combatant("e1", 1, "enemy")]);
    const result = computeBalance(enc);
    expect(result.partyPower).toBe(0);
    // encounterPower > 0 with partyPower = 0 means partyPower * any multiplier = 0
    // encounterPower >= 0 = all thresholds → highest bucket
    expect(result.classification.bucket).toBe("Impossible");
  });
});
