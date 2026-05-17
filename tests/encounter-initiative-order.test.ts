import { describe, expect, it } from "vitest";

import type { InitiativeRow } from "@/page/encounters/utils/initiativeOrder";
import { sortInitiative } from "@/page/encounters/utils/initiativeOrder";

function row(
  id: string,
  initiative: number | null,
  dexMod = 0,
  side: "ally" | "enemy" = "enemy"
): InitiativeRow {
  return { kind: "combatant", id, name: id, side, initiative, dexMod };
}

describe("sortInitiative", () => {
  it("orders descending by initiative", () => {
    const sorted = sortInitiative([row("a", 5), row("b", 15), row("c", 10)]);
    expect(sorted.map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("sends null initiatives to the bottom in stable input order", () => {
    const sorted = sortInitiative([
      row("a", null),
      row("b", 5),
      row("c", null),
      row("d", 10),
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["d", "b", "a", "c"]);
  });

  it("ties break by higher dex modifier", () => {
    const sorted = sortInitiative([
      row("a", 10, 1),
      row("b", 10, 5),
      row("c", 10, -2),
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["b", "a", "c"]);
  });

  it("ties with equal dex break deterministically by id", () => {
    const sorted = sortInitiative([
      row("zeta", 10, 2),
      row("alpha", 10, 2),
      row("middle", 10, 2),
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["alpha", "middle", "zeta"]);
  });

  it("input array is not mutated", () => {
    const input = [row("a", 1), row("b", 2)];
    const snapshot = [...input];
    sortInitiative(input);
    expect(input).toEqual(snapshot);
  });

  it("all-null input is returned unchanged", () => {
    const input = [row("a", null), row("b", null)];
    const sorted = sortInitiative(input);
    expect(sorted.map((r) => r.id)).toEqual(["a", "b"]);
  });
});
