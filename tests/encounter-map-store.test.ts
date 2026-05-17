import { beforeEach, describe, expect, it } from "vitest";

import type { Monster } from "@/lib/domain/monster.schema";
import {
  migrateEncounterLibrary,
  useEncounterLibraryStore,
} from "@/lib/store/useEncounterLibraryStore";

function mockMonster(): Monster {
  return {
    id: "m-goblin",
    name: "Goblin",
    nameNormalized: "goblin",
    challengeRating: "1/4",
    crNumeric: 0.25,
    hitPoints: "7",
    armorClass: "15",
    size: "Small",
    type: "humanoid",
    alignment: "neutral evil",
    source: "MM",
    speed: "30 ft.",
    abilityScores: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    schemaVersion: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    createdBy: "test",
    updatedAt: "2024-01-01T00:00:00.000Z",
    updatedBy: "test",
    isPublished: true,
  };
}

describe("encounter store map actions", () => {
  beforeEach(() => {
    useEncounterLibraryStore.setState({ encounters: [], tipsEphemeral: {} });
  });

  it("setMap initializes with defaults merged with provided partial", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    useEncounterLibraryStore.getState().setMap(id, { cols: 24 });
    const enc = useEncounterLibraryStore.getState().encounters[0]!;
    expect(enc.map).toEqual({
      grid: "square",
      cols: 24,
      rows: 15,
      cellSize: 48,
    });
  });

  it("setMap is additive: subsequent partials patch existing map", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    useEncounterLibraryStore.getState().setMap(id, { cols: 24, rows: 18 });
    useEncounterLibraryStore.getState().setMap(id, { cellSize: 64 });
    expect(useEncounterLibraryStore.getState().encounters[0]!.map).toEqual({
      grid: "square",
      cols: 24,
      rows: 18,
      cellSize: 64,
    });
  });

  it("placeToken records position on a combatant", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    const [cid] = useEncounterLibraryStore.getState().addCombatant(id, {
      monster: mockMonster(),
      side: "enemy",
    });
    useEncounterLibraryStore
      .getState()
      .placeToken(id, "combatant", cid!, { x: 3, y: 4 });
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.combatants[0]!.position
    ).toEqual({ x: 3, y: 4 });
  });

  it("placeToken records position on a party member", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    const pcId = useEncounterLibraryStore
      .getState()
      .addPC(id, { name: "Frodo", level: 3 });
    useEncounterLibraryStore
      .getState()
      .placeToken(id, "pc", pcId, { x: 1, y: 1 });
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.partyMembers[0]!
        .position
    ).toEqual({ x: 1, y: 1 });
  });

  it("removeToken strips position rather than setting null/undefined", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    const [cid] = useEncounterLibraryStore.getState().addCombatant(id, {
      monster: mockMonster(),
      side: "enemy",
    });
    useEncounterLibraryStore
      .getState()
      .placeToken(id, "combatant", cid!, { x: 2, y: 2 });
    useEncounterLibraryStore.getState().removeToken(id, "combatant", cid!);
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.combatants[0]!.position
    ).toBeUndefined();
  });

  it("clearMap removes map AND all positions on combatants + party members", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    const pcId = useEncounterLibraryStore
      .getState()
      .addPC(id, { name: "Frodo", level: 3 });
    const [cid] = useEncounterLibraryStore.getState().addCombatant(id, {
      monster: mockMonster(),
      side: "enemy",
    });
    useEncounterLibraryStore.getState().setMap(id, { cols: 30 });
    useEncounterLibraryStore
      .getState()
      .placeToken(id, "pc", pcId, { x: 1, y: 1 });
    useEncounterLibraryStore
      .getState()
      .placeToken(id, "combatant", cid!, { x: 3, y: 4 });

    useEncounterLibraryStore.getState().clearMap(id);
    const enc = useEncounterLibraryStore.getState().encounters[0]!;
    expect(enc.map).toBeUndefined();
    expect(enc.partyMembers[0]!.position).toBeUndefined();
    expect(enc.combatants[0]!.position).toBeUndefined();
  });

  it("moveToken is an alias for placeToken (used for drag-end semantics)", () => {
    const id = useEncounterLibraryStore.getState().createEncounter();
    const [cid] = useEncounterLibraryStore.getState().addCombatant(id, {
      monster: mockMonster(),
      side: "enemy",
    });
    useEncounterLibraryStore
      .getState()
      .placeToken(id, "combatant", cid!, { x: 1, y: 1 });
    useEncounterLibraryStore
      .getState()
      .moveToken(id, "combatant", cid!, { x: 5, y: 6 });
    expect(
      useEncounterLibraryStore.getState().encounters[0]!.combatants[0]!.position
    ).toEqual({ x: 5, y: 6 });
  });
});

describe("migrateEncounterLibrary v2 → v3", () => {
  it("preserves existing position on combatants", () => {
    const v2 = {
      encounters: [
        {
          id: "e1",
          name: "E",
          ruleset: "advanced",
          partyMembers: [],
          combatants: [
            {
              id: "c1",
              monsterId: "m",
              monsterName: "M",
              monsterCrNumeric: 1,
              side: "enemy",
              maxHp: 10,
              currentHp: 10,
              initiative: null,
              position: { x: 3, y: 4 },
            },
          ],
          initiative: { round: 1, activeIndex: null },
          tips: null,
          tipsGeneratedAt: null,
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    };
    const result = migrateEncounterLibrary(v2, 2);
    expect(result.encounters[0]!.combatants[0]!.position).toEqual({
      x: 3,
      y: 4,
    });
  });

  it("treats v2 records without `map` as having no map (key absent, not null)", () => {
    const v2 = {
      encounters: [
        {
          id: "e1",
          name: "E",
          ruleset: "advanced",
          partyMembers: [],
          combatants: [],
          initiative: { round: 1, activeIndex: null },
          tips: null,
          tipsGeneratedAt: null,
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    };
    const result = migrateEncounterLibrary(v2, 2);
    expect(result.encounters[0]!.map).toBeUndefined();
  });

  it("coerces a malformed map (wrong grid type) to undefined", () => {
    const result = migrateEncounterLibrary(
      {
        encounters: [
          {
            id: "e1",
            name: "E",
            ruleset: "advanced",
            partyMembers: [],
            combatants: [],
            initiative: { round: 1, activeIndex: null },
            tips: null,
            tipsGeneratedAt: null,
            map: { grid: "hex", cols: 20, rows: 15, cellSize: 48 },
            createdAt: 0,
            updatedAt: 0,
          },
        ],
      },
      3
    );
    expect(result.encounters[0]!.map).toBeUndefined();
  });

  it("clamps oversized cols/rows/cellSize to schema bounds", () => {
    const result = migrateEncounterLibrary(
      {
        encounters: [
          {
            id: "e1",
            name: "E",
            ruleset: "advanced",
            partyMembers: [],
            combatants: [],
            initiative: { round: 1, activeIndex: null },
            tips: null,
            tipsGeneratedAt: null,
            map: { grid: "square", cols: 200, rows: 1, cellSize: 500 },
            createdAt: 0,
            updatedAt: 0,
          },
        ],
      },
      3
    );
    expect(result.encounters[0]!.map).toEqual({
      grid: "square",
      cols: 60,
      rows: 4,
      cellSize: 96,
    });
  });
});
