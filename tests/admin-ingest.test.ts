import { describe, expect, it } from "vitest";

import { toNameNormalized, toSlug } from "@/lib/admin/ingest";
import { DEFAULT_MONSTER_ADMIN_FORM } from "@/page/admin-monsters-create/constants";
import { toMonsterPayload } from "@/page/admin-monsters-create/utils/form-state";
import { DEFAULT_SPELL_ADMIN_FORM } from "@/page/admin-spells-create/constants";
import { toSpellPayload } from "@/page/admin-spells-create/utils/form-state";

describe("admin ingest helpers", () => {
  it("slugifies names", () => {
    expect(toSlug("Mordenkainen's Sword")).toBe("mordenkainens-sword");
    expect(toNameNormalized("  Fire   Ball ")).toBe("fire ball");
  });

  it("builds spell payload from structured state", () => {
    const payload = toSpellPayload({
      ...DEFAULT_SPELL_ADMIN_FORM,
      castingTime: "1 action",
      classesText: "wizard, sorcerer",
      componentSomatic: true,
      componentVerbal: true,
      descriptionText: "A bright streak flashes.",
      duration: "Instantaneous",
      level: "3",
      name: "Fireball",
      range: "150 feet",
    });

    expect(payload?.id).toBe("fireball");
    expect(payload?.nameNormalized).toBe("fireball");
    expect(payload?.classes).toEqual(["wizard", "sorcerer"]);
  });

  it("builds monster payload from structured state", () => {
    const payload = toMonsterPayload({
      ...DEFAULT_MONSTER_ADMIN_FORM,
      alignment: "neutral evil",
      armorClass: "15",
      challengeRating: "1/4",
      crNumeric: "0.25",
      hitPoints: "7 (2d6)",
      name: "Goblin",
      proficiencyBonus: "2",
      speed: "30 ft.",
      type: "humanoid (goblinoid)",
    });

    expect(payload?.id).toBe("goblin");
    expect(payload?.abilityScores.str).toBe(10);
    expect(payload?.crNumeric).toBe(0.25);
    expect(payload?.proficiencyBonus).toBe(2);
  });
});
