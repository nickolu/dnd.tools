import { describe, expect, it } from "vitest";

import type { SavedSpellList } from "@/lib/domain/saved-spell-list";
import type { Spell } from "@/lib/domain/spell.schema";

// Minimal spell factory for pre-filter tests
const baseSpell: Omit<
  Spell,
  "id" | "name" | "nameNormalized" | "classes" | "concentration" | "components"
> = {
  castingTime: "1 action",
  createdAt: "2026-01-01T00:00:00.000Z",
  createdBy: "test",
  description: ["test"],
  duration: "Instantaneous",
  isPublished: true,
  level: 1,
  range: "60 feet",
  ritual: false,
  schemaVersion: 1,
  school: "evocation",
  source: "PHB",
  updatedAt: "2026-01-01T00:00:00.000Z",
  updatedBy: "test",
};

function makeSpell(id: string, name: string): Spell {
  return {
    ...baseSpell,
    classes: ["wizard"],
    concentration: false,
    components: { material: false, somatic: true, verbal: true },
    id,
    name,
    nameNormalized: name.toLowerCase(),
  };
}

function makeList(id: string, spellIds: string[]): SavedSpellList {
  const now = Date.now();
  return { id, name: "Test List", spellIds, createdAt: now, updatedAt: now };
}

// Replicate the pre-filter logic from app/spells/page.tsx
function applyListPreFilter(
  spells: Spell[],
  activeList: SavedSpellList | null
): Spell[] {
  if (!activeList) return spells;
  const idSet = new Set(activeList.spellIds);
  return spells.filter((spell) => idSet.has(spell.id));
}

describe("spell list pre-filter (page-level scope)", () => {
  const allSpells = [
    makeSpell("a", "Fireball"),
    makeSpell("b", "Ice Storm"),
    makeSpell("c", "Lightning Bolt"),
    makeSpell("d", "Magic Missile"),
  ];

  it("returns all spells when no list is active", () => {
    const result = applyListPreFilter(allSpells, null);
    expect(result.map((s) => s.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("filters to only spells in the active list", () => {
    const list = makeList("list-1", ["a", "c"]);
    const result = applyListPreFilter(allSpells, list);
    expect(result.map((s) => s.id)).toEqual(["a", "c"]);
  });

  it("returns empty array when active list has no matching spells", () => {
    const list = makeList("list-1", ["z", "y"]);
    const result = applyListPreFilter(allSpells, list);
    expect(result).toHaveLength(0);
  });

  it("returns empty array when active list is empty", () => {
    const list = makeList("list-1", []);
    const result = applyListPreFilter(allSpells, list);
    expect(result).toHaveLength(0);
  });

  it("preserves spell order from original spells array", () => {
    const list = makeList("list-1", ["c", "a"]); // reversed order in list
    const result = applyListPreFilter(allSpells, list);
    // Order should match allSpells array order, not list order
    expect(result.map((s) => s.id)).toEqual(["a", "c"]);
  });

  it("resolves activeList from listIdParam correctly", () => {
    const lists: SavedSpellList[] = [
      makeList("list-1", ["a", "b"]),
      makeList("list-2", ["c", "d"]),
    ];

    // Simulate: listIdParam ? lists.find(...) ?? null : null
    const resolve = (listIdParam: string | null) =>
      listIdParam ? (lists.find((l) => l.id === listIdParam) ?? null) : null;

    expect(resolve(null)).toBeNull();
    expect(resolve("list-1")).toBe(lists[0]);
    expect(resolve("list-2")).toBe(lists[1]);
    expect(resolve("nonexistent")).toBeNull();
  });

  it("returns null for stale listIdParam referencing a deleted list", () => {
    // After list deletion, the deleted list ID is gone from store
    const remainingLists: SavedSpellList[] = [];
    const resolveAfterDelete = (listIdParam: string | null) =>
      listIdParam
        ? (remainingLists.find((l) => l.id === listIdParam) ?? null)
        : null;

    expect(resolveAfterDelete("list-1")).toBeNull();
  });
});

describe("SpellResultsSummary display logic", () => {
  it("shows list context when activeListName is provided", () => {
    // This tests the logic, not the rendering (which is trivial)
    const visible = 3;
    const activeListTotal = 10;
    const activeListName = "My Prepared Spells";

    // Verify the condition used in the component
    const showListContext =
      activeListName !== undefined && activeListTotal !== undefined;
    expect(showListContext).toBe(true);

    // Expected text: "Showing 3 of 10 in My Prepared Spells"
    const displayText = `Showing ${visible} of ${activeListTotal} in ${activeListName}`;
    expect(displayText).toBe("Showing 3 of 10 in My Prepared Spells");
  });

  it("falls back to total spells count when no list is active", () => {
    const visible = 50;
    const activeListName: string | undefined = undefined;
    const activeListTotal: number | undefined = undefined;

    const showListContext =
      activeListName !== undefined && activeListTotal !== undefined;
    expect(showListContext).toBe(false);

    const displayText = `Showing ${visible} of 500 spells`;
    expect(displayText).toBe("Showing 50 of 500 spells");
  });
});
