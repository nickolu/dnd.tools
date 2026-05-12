import { beforeEach, describe, expect, it } from "vitest";

import { useSavedMonsterListStore } from "@/lib/store/useSavedMonsterListStore";

describe("useSavedMonsterListStore", () => {
  beforeEach(() => {
    useSavedMonsterListStore.setState({ lists: [] });
  });

  it("initial state has empty lists array", () => {
    const state = useSavedMonsterListStore.getState();
    expect(state.lists).toEqual([]);
  });

  it("createList adds a new list with trimmed name, generated ID, timestamps, empty monsterIds", () => {
    const id = useSavedMonsterListStore.getState().createList("My Monsters");
    expect(id).toBeTruthy();

    const state = useSavedMonsterListStore.getState();
    expect(state.lists).toHaveLength(1);

    const list = state.lists[0]!;
    expect(list.id).toBe(id);
    expect(list.name).toBe("My Monsters");
    expect(list.monsterIds).toEqual([]);
    expect(typeof list.createdAt).toBe("number");
    expect(typeof list.updatedAt).toBe("number");
  });

  it("createList with blank name returns empty string and adds no list", () => {
    const id = useSavedMonsterListStore.getState().createList("  ");
    expect(id).toBe("");
    expect(useSavedMonsterListStore.getState().lists).toHaveLength(0);
  });

  it("createList trims whitespace from name", () => {
    useSavedMonsterListStore.getState().createList("  Prepared Monsters  ");
    const state = useSavedMonsterListStore.getState();
    expect(state.lists[0]!.name).toBe("Prepared Monsters");
  });

  it("deleteList removes the list by ID", () => {
    const id = useSavedMonsterListStore.getState().createList("To Delete");
    useSavedMonsterListStore.getState().deleteList(id);
    expect(useSavedMonsterListStore.getState().lists).toHaveLength(0);
  });

  it("deleteList with nonexistent ID is a no-op and does not error", () => {
    useSavedMonsterListStore.getState().createList("Keep Me");
    useSavedMonsterListStore.getState().deleteList("nonexistent-id");
    expect(useSavedMonsterListStore.getState().lists).toHaveLength(1);
  });

  it("renameList updates name and updatedAt", () => {
    const id = useSavedMonsterListStore.getState().createList("Old Name");
    const before = useSavedMonsterListStore.getState().lists[0]!.updatedAt;

    useSavedMonsterListStore.getState().renameList(id, "New Name");
    const list = useSavedMonsterListStore.getState().lists[0]!;

    expect(list.name).toBe("New Name");
    expect(list.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("renameList with blank name is a no-op", () => {
    const id = useSavedMonsterListStore.getState().createList("Keep This Name");
    useSavedMonsterListStore.getState().renameList(id, "  ");
    expect(useSavedMonsterListStore.getState().lists[0]!.name).toBe(
      "Keep This Name"
    );
  });

  it("renameList with nonexistent ID is a no-op", () => {
    useSavedMonsterListStore.getState().createList("Existing");
    useSavedMonsterListStore
      .getState()
      .renameList("nonexistent-id", "Should Not Apply");
    expect(useSavedMonsterListStore.getState().lists[0]!.name).toBe("Existing");
  });

  it("addMonsterToList adds monsterId and updates updatedAt", () => {
    const id = useSavedMonsterListStore.getState().createList("My List");
    const before = useSavedMonsterListStore.getState().lists[0]!.updatedAt;

    useSavedMonsterListStore.getState().addMonsterToList(id, "monster-1");
    const list = useSavedMonsterListStore.getState().lists[0]!;

    expect(list.monsterIds).toContain("monster-1");
    expect(list.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("addMonsterToList is idempotent — adding same monster twice results in one entry", () => {
    const id = useSavedMonsterListStore.getState().createList("My List");
    useSavedMonsterListStore.getState().addMonsterToList(id, "monster-1");
    useSavedMonsterListStore.getState().addMonsterToList(id, "monster-1");

    const list = useSavedMonsterListStore.getState().lists[0]!;
    expect(list.monsterIds).toEqual(["monster-1"]);
  });

  it("removeMonsterFromList removes the monsterId", () => {
    const id = useSavedMonsterListStore.getState().createList("My List");
    useSavedMonsterListStore.getState().addMonsterToList(id, "monster-1");
    useSavedMonsterListStore.getState().removeMonsterFromList(id, "monster-1");

    expect(
      useSavedMonsterListStore.getState().lists[0]!.monsterIds
    ).not.toContain("monster-1");
  });

  it("removeMonsterFromList with monster not in list is a no-op", () => {
    const id = useSavedMonsterListStore.getState().createList("My List");
    useSavedMonsterListStore.getState().addMonsterToList(id, "monster-1");
    const before = useSavedMonsterListStore.getState().lists[0]!.updatedAt;

    useSavedMonsterListStore
      .getState()
      .removeMonsterFromList(id, "not-in-list");
    const list = useSavedMonsterListStore.getState().lists[0]!;

    expect(list.monsterIds).toEqual(["monster-1"]);
    expect(list.updatedAt).toBe(before);
  });

  it("toggleMonsterInActiveList adds monster if absent, removes if present", () => {
    const id = useSavedMonsterListStore.getState().createList("My List");

    // Toggle adds
    useSavedMonsterListStore
      .getState()
      .toggleMonsterInActiveList(id, "monster-1");
    expect(useSavedMonsterListStore.getState().lists[0]!.monsterIds).toContain(
      "monster-1"
    );

    // Toggle removes
    useSavedMonsterListStore
      .getState()
      .toggleMonsterInActiveList(id, "monster-1");
    expect(
      useSavedMonsterListStore.getState().lists[0]!.monsterIds
    ).not.toContain("monster-1");
  });

  it("toggleMonsterInActiveList with nonexistent listId is a no-op", () => {
    useSavedMonsterListStore.getState().createList("My List");
    // Should not throw
    expect(() => {
      useSavedMonsterListStore
        .getState()
        .toggleMonsterInActiveList("nonexistent-id", "monster-1");
    }).not.toThrow();
    // No lists modified
    expect(
      useSavedMonsterListStore.getState().lists[0]!.monsterIds
    ).toHaveLength(0);
  });
});
