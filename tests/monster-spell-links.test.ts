import { describe, expect, it } from "vitest";

import { buildSpellLinkParts } from "@/page/monsters/components/monster-card/components/named-text-section/utils/buildSpellLinkParts";

describe("buildSpellLinkParts", () => {
  it("links spell names from spellList inside action text", () => {
    const parts = buildSpellLinkParts(
      "At will: mage armor, detect magic. 1/day: plane shift.",
      ["mage armor", "detect magic", "plane shift"]
    );

    expect(parts).toEqual([
      "At will: ",
      { spellName: "mage armor", text: "mage armor" },
      ", ",
      { spellName: "detect magic", text: "detect magic" },
      ". 1/day: ",
      { spellName: "plane shift", text: "plane shift" },
      ".",
    ]);
  });

  it("does not match inside larger words", () => {
    const parts = buildSpellLinkParts(
      "The creature speaks with animals and calls speak with animals.",
      ["speak with animals"]
    );

    expect(parts).toEqual([
      "The creature speaks with animals and calls ",
      { spellName: "speak with animals", text: "speak with animals" },
      ".",
    ]);
  });
});
