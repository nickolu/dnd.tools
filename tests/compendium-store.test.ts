import { beforeEach, describe, expect, it } from "vitest";

import { useCompendiumStore } from "@/lib/store/useCompendiumStore";

describe("useCompendiumStore", () => {
  beforeEach(() => {
    useCompendiumStore.setState({
      filters: {
        monsterName: "",
        spellName: "",
      },
      selectedMonsterId: null,
      selectedSpellId: null,
      sort: {
        direction: "asc",
        field: "nameNormalized",
      },
    });
  });

  it("updates filters", () => {
    useCompendiumStore.getState().setMonsterFilter("dragon");
    useCompendiumStore.getState().setSpellFilter("fire");

    const state = useCompendiumStore.getState();
    expect(state.filters.monsterName).toBe("dragon");
    expect(state.filters.spellName).toBe("fire");
  });

  it("updates selected ids and sort", () => {
    useCompendiumStore.getState().setSelectedMonsterId("adult-red-dragon");
    useCompendiumStore.getState().setSelectedSpellId("fireball");
    useCompendiumStore.getState().setSort("level", "desc");

    const state = useCompendiumStore.getState();
    expect(state.selectedMonsterId).toBe("adult-red-dragon");
    expect(state.selectedSpellId).toBe("fireball");
    expect(state.sort).toEqual({ direction: "desc", field: "level" });
  });
});
