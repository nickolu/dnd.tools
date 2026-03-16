import { beforeEach, describe, expect, it } from "vitest";

import { useSavedSpellListStore } from "@/lib/store/useSavedSpellListStore";

describe("useSavedSpellListStore", () => {
  beforeEach(() => {
    useSavedSpellListStore.setState({ lists: [] });
  });

  it("initial state has empty lists array", () => {
    const state = useSavedSpellListStore.getState();
    expect(state.lists).toEqual([]);
  });

  it("createList adds a new list with trimmed name, generated ID, timestamps, empty spellIds", () => {
    const id = useSavedSpellListStore.getState().createList("My Spells");
    expect(id).toBeTruthy();

    const state = useSavedSpellListStore.getState();
    expect(state.lists).toHaveLength(1);

    const list = state.lists[0]!;
    expect(list.id).toBe(id);
    expect(list.name).toBe("My Spells");
    expect(list.spellIds).toEqual([]);
    expect(typeof list.createdAt).toBe("number");
    expect(typeof list.updatedAt).toBe("number");
  });

  it("createList with blank name returns empty string and adds no list", () => {
    const id = useSavedSpellListStore.getState().createList("  ");
    expect(id).toBe("");
    expect(useSavedSpellListStore.getState().lists).toHaveLength(0);
  });

  it("createList trims whitespace from name", () => {
    useSavedSpellListStore.getState().createList("  Prepared Spells  ");
    const state = useSavedSpellListStore.getState();
    expect(state.lists[0]!.name).toBe("Prepared Spells");
  });

  it("deleteList removes the list by ID", () => {
    const id = useSavedSpellListStore.getState().createList("To Delete");
    useSavedSpellListStore.getState().deleteList(id);
    expect(useSavedSpellListStore.getState().lists).toHaveLength(0);
  });

  it("deleteList with nonexistent ID is a no-op and does not error", () => {
    useSavedSpellListStore.getState().createList("Keep Me");
    useSavedSpellListStore.getState().deleteList("nonexistent-id");
    expect(useSavedSpellListStore.getState().lists).toHaveLength(1);
  });

  it("renameList updates name and updatedAt", () => {
    const id = useSavedSpellListStore.getState().createList("Old Name");
    const before = useSavedSpellListStore.getState().lists[0]!.updatedAt;

    useSavedSpellListStore.getState().renameList(id, "New Name");
    const list = useSavedSpellListStore.getState().lists[0]!;

    expect(list.name).toBe("New Name");
    expect(list.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("renameList with blank name is a no-op", () => {
    const id = useSavedSpellListStore.getState().createList("Keep This Name");
    useSavedSpellListStore.getState().renameList(id, "  ");
    expect(useSavedSpellListStore.getState().lists[0]!.name).toBe(
      "Keep This Name"
    );
  });

  it("renameList with nonexistent ID is a no-op", () => {
    useSavedSpellListStore.getState().createList("Existing");
    useSavedSpellListStore
      .getState()
      .renameList("nonexistent-id", "Should Not Apply");
    expect(useSavedSpellListStore.getState().lists[0]!.name).toBe("Existing");
  });

  it("addSpellToList adds spellId and updates updatedAt", () => {
    const id = useSavedSpellListStore.getState().createList("My List");
    const before = useSavedSpellListStore.getState().lists[0]!.updatedAt;

    useSavedSpellListStore.getState().addSpellToList(id, "spell-1");
    const list = useSavedSpellListStore.getState().lists[0]!;

    expect(list.spellIds).toContain("spell-1");
    expect(list.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("addSpellToList is idempotent — adding same spell twice results in one entry", () => {
    const id = useSavedSpellListStore.getState().createList("My List");
    useSavedSpellListStore.getState().addSpellToList(id, "spell-1");
    useSavedSpellListStore.getState().addSpellToList(id, "spell-1");

    const list = useSavedSpellListStore.getState().lists[0]!;
    expect(list.spellIds).toEqual(["spell-1"]);
  });

  it("removeSpellFromList removes the spellId", () => {
    const id = useSavedSpellListStore.getState().createList("My List");
    useSavedSpellListStore.getState().addSpellToList(id, "spell-1");
    useSavedSpellListStore.getState().removeSpellFromList(id, "spell-1");

    expect(useSavedSpellListStore.getState().lists[0]!.spellIds).not.toContain(
      "spell-1"
    );
  });

  it("removeSpellFromList with spell not in list is a no-op", () => {
    const id = useSavedSpellListStore.getState().createList("My List");
    useSavedSpellListStore.getState().addSpellToList(id, "spell-1");
    const before = useSavedSpellListStore.getState().lists[0]!.updatedAt;

    useSavedSpellListStore.getState().removeSpellFromList(id, "not-in-list");
    const list = useSavedSpellListStore.getState().lists[0]!;

    expect(list.spellIds).toEqual(["spell-1"]);
    expect(list.updatedAt).toBe(before);
  });

  it("toggleSpellInActiveList adds spell if absent, removes if present", () => {
    const id = useSavedSpellListStore.getState().createList("My List");

    // Toggle adds
    useSavedSpellListStore.getState().toggleSpellInActiveList(id, "spell-1");
    expect(useSavedSpellListStore.getState().lists[0]!.spellIds).toContain(
      "spell-1"
    );

    // Toggle removes
    useSavedSpellListStore.getState().toggleSpellInActiveList(id, "spell-1");
    expect(useSavedSpellListStore.getState().lists[0]!.spellIds).not.toContain(
      "spell-1"
    );
  });

  it("toggleSpellInActiveList with nonexistent listId is a no-op", () => {
    useSavedSpellListStore.getState().createList("My List");
    // Should not throw
    expect(() => {
      useSavedSpellListStore
        .getState()
        .toggleSpellInActiveList("nonexistent-id", "spell-1");
    }).not.toThrow();
    // No lists modified
    expect(useSavedSpellListStore.getState().lists[0]!.spellIds).toHaveLength(
      0
    );
  });
});
