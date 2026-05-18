import { describe, expect, it } from "vitest";

import { computePartyPower } from "@/lib/domain/encounter/cr2/computePartyPower";
import { PC_POWER_BY_LEVEL } from "@/lib/domain/encounter/cr2/constants";
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

describe("PC_POWER_BY_LEVEL", () => {
  it("returns 11 at level 1", () => {
    expect(PC_POWER_BY_LEVEL[1]).toBe(11);
  });

  it("returns 32 at level 5", () => {
    expect(PC_POWER_BY_LEVEL[5]).toBe(32);
  });

  it("returns 53 at level 10", () => {
    expect(PC_POWER_BY_LEVEL[10]).toBe(53);
  });

  it("returns 62 at level 11", () => {
    expect(PC_POWER_BY_LEVEL[11]).toBe(62);
  });

  it("returns 141 at level 20", () => {
    expect(PC_POWER_BY_LEVEL[20]).toBe(141);
  });
});

describe("computePartyPower", () => {
  it("sums PC power for a mixed-level party (1+5+10 = 96)", () => {
    expect(computePartyPower([pc(1), pc(5), pc(10)], [], "advanced")).toBe(96);
  });

  it("empty party with no allies has 0 power", () => {
    expect(computePartyPower([], [], "advanced")).toBe(0);
  });

  it("single level-20 PC has 141 power", () => {
    expect(computePartyPower([pc(20)], [], "basic")).toBe(141);
  });

  it("adds ally combatant power on top of PC power", () => {
    const partyPowerNoAlly = computePartyPower(
      [pc(5), pc(5), pc(5), pc(5)],
      [],
      "advanced"
    );
    const ally = {
      id: "ally-1",
      monsterId: "m-1",
      monsterName: "Imp",
      monsterCrNumeric: 1,
      side: "ally" as const,
      maxHp: 10,
      currentHp: 10,
      initiative: null,
      conditions: [],
    };
    const partyPowerWithAlly = computePartyPower(
      [pc(5), pc(5), pc(5), pc(5)],
      [ally],
      "advanced"
    );
    // Advanced T2 CR 1 → 17 power
    expect(partyPowerWithAlly - partyPowerNoAlly).toBe(17);
  });
});
