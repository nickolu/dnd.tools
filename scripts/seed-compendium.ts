import { loadEnvConfig } from "@next/env";
import { FieldValue } from "firebase-admin/firestore";

import {
  type MonsterWriteInput,
  monsterWriteSchema,
} from "@/lib/domain/monster.schema";
import {
  type SpellWriteInput,
  spellWriteSchema,
} from "@/lib/domain/spell.schema";

const CREATED_BY = "seed-script";
const SCHEMA_VERSION = 1;
const SOURCE = "SRD 5.1";

const spells: SpellWriteInput[] = [
  {
    castingTime: "1 action",
    classes: ["wizard"],
    components: { material: false, somatic: true, verbal: true },
    concentration: false,
    createdBy: CREATED_BY,
    description: [
      "Three glowing darts of magical force strike creatures you can see.",
    ],
    duration: "Instantaneous",
    id: "magic-missile",
    isPublished: true,
    level: 1,
    name: "Magic Missile",
    nameNormalized: "magic missile",
    range: "120 feet",
    ritual: false,
    schemaVersion: SCHEMA_VERSION,
    school: "evocation",
    source: SOURCE,
    updatedBy: CREATED_BY,
  },
  {
    castingTime: "1 action",
    classes: ["wizard", "sorcerer"],
    components: {
      material: true,
      materialText: "A tiny ball of bat guano and sulfur.",
      somatic: true,
      verbal: true,
    },
    concentration: false,
    createdBy: CREATED_BY,
    damage: { type: "fire", diceBySlot: { "3": "8d6" } },
    description: [
      "A bright streak explodes in a 20-foot-radius sphere of fire.",
    ],
    duration: "Instantaneous",
    id: "fireball",
    isPublished: true,
    level: 3,
    name: "Fireball",
    nameNormalized: "fireball",
    range: "150 feet",
    ritual: false,
    save: { ability: "dex", onSuccess: "half" },
    schemaVersion: SCHEMA_VERSION,
    school: "evocation",
    source: SOURCE,
    updatedBy: CREATED_BY,
  },
  {
    castingTime: "1 action",
    classes: ["cleric", "druid", "bard", "paladin", "ranger"],
    components: { material: false, somatic: true, verbal: true },
    concentration: false,
    createdBy: CREATED_BY,
    description: ["A creature you touch regains hit points."],
    duration: "Instantaneous",
    id: "cure-wounds",
    isPublished: true,
    level: 1,
    name: "Cure Wounds",
    nameNormalized: "cure wounds",
    range: "Touch",
    ritual: false,
    schemaVersion: SCHEMA_VERSION,
    school: "evocation",
    source: SOURCE,
    updatedBy: CREATED_BY,
  },
  {
    castingTime: "1 reaction",
    classes: ["wizard", "sorcerer"],
    components: { material: false, somatic: true, verbal: true },
    concentration: false,
    createdBy: CREATED_BY,
    description: ["An invisible barrier of magical force protects you."],
    duration: "1 round",
    id: "shield",
    isPublished: true,
    level: 1,
    name: "Shield",
    nameNormalized: "shield",
    range: "Self",
    ritual: false,
    schemaVersion: SCHEMA_VERSION,
    school: "abjuration",
    source: SOURCE,
    updatedBy: CREATED_BY,
  },
  {
    castingTime: "1 action",
    classes: ["wizard", "cleric", "druid", "bard", "paladin", "ranger"],
    components: { material: false, somatic: true, verbal: true },
    concentration: true,
    createdBy: CREATED_BY,
    description: [
      "For the duration, you sense the presence of magic within 30 feet.",
    ],
    duration: "Concentration, up to 10 minutes",
    id: "detect-magic",
    isPublished: true,
    level: 1,
    name: "Detect Magic",
    nameNormalized: "detect magic",
    range: "Self",
    ritual: true,
    schemaVersion: SCHEMA_VERSION,
    school: "divination",
    source: SOURCE,
    updatedBy: CREATED_BY,
  },
  {
    castingTime: "1 action",
    classes: ["wizard", "sorcerer", "warlock", "bard"],
    components: { material: false, somatic: true, verbal: true },
    concentration: false,
    createdBy: CREATED_BY,
    description: [
      "A spectral hand appears at a point you choose within range.",
    ],
    duration: "1 minute",
    id: "mage-hand",
    isPublished: true,
    level: 0,
    name: "Mage Hand",
    nameNormalized: "mage hand",
    range: "30 feet",
    ritual: false,
    schemaVersion: SCHEMA_VERSION,
    school: "conjuration",
    source: SOURCE,
    updatedBy: CREATED_BY,
  },
  {
    castingTime: "1 action",
    classes: ["cleric", "paladin"],
    components: {
      material: true,
      materialText: "A sprinkling of holy water.",
      somatic: true,
      verbal: true,
    },
    concentration: true,
    createdBy: CREATED_BY,
    description: [
      "Up to three creatures add 1d4 to attack rolls and saving throws.",
    ],
    duration: "Concentration, up to 1 minute",
    id: "bless",
    isPublished: true,
    level: 1,
    name: "Bless",
    nameNormalized: "bless",
    range: "30 feet",
    ritual: false,
    schemaVersion: SCHEMA_VERSION,
    school: "enchantment",
    source: SOURCE,
    updatedBy: CREATED_BY,
  },
  {
    castingTime: "1 action",
    classes: ["wizard", "sorcerer", "bard", "warlock"],
    components: {
      material: true,
      materialText: "An eyelash encased in gum arabic.",
      somatic: true,
      verbal: true,
    },
    concentration: true,
    createdBy: CREATED_BY,
    description: [
      "A creature you touch becomes invisible until the spell ends.",
    ],
    duration: "Concentration, up to 1 hour",
    id: "invisibility",
    isPublished: true,
    level: 2,
    name: "Invisibility",
    nameNormalized: "invisibility",
    range: "Touch",
    ritual: false,
    schemaVersion: SCHEMA_VERSION,
    school: "illusion",
    source: SOURCE,
    updatedBy: CREATED_BY,
  },
  {
    castingTime: "1 bonus action",
    classes: ["wizard", "sorcerer", "warlock"],
    components: { material: false, somatic: true, verbal: true },
    concentration: false,
    createdBy: CREATED_BY,
    description: [
      "You teleport up to 30 feet to an unoccupied space you can see.",
    ],
    duration: "Instantaneous",
    id: "misty-step",
    isPublished: true,
    level: 2,
    name: "Misty Step",
    nameNormalized: "misty step",
    range: "Self",
    ritual: false,
    schemaVersion: SCHEMA_VERSION,
    school: "conjuration",
    source: SOURCE,
    updatedBy: CREATED_BY,
  },
  {
    castingTime: "1 reaction",
    classes: ["wizard", "sorcerer", "warlock"],
    components: { material: false, somatic: true, verbal: true },
    concentration: false,
    createdBy: CREATED_BY,
    description: [
      "You attempt to interrupt a creature in the process of casting a spell.",
    ],
    duration: "Instantaneous",
    id: "counterspell",
    isPublished: true,
    level: 3,
    name: "Counterspell",
    nameNormalized: "counterspell",
    range: "60 feet",
    ritual: false,
    schemaVersion: SCHEMA_VERSION,
    school: "abjuration",
    source: SOURCE,
    updatedBy: CREATED_BY,
  },
];

const monsters: MonsterWriteInput[] = [
  {
    abilityScores: { cha: 8, con: 10, dex: 14, int: 10, str: 8, wis: 8 },
    alignment: "neutral evil",
    armorClass: "15 (leather armor, shield)",
    challengeRating: "1/4",
    createdBy: CREATED_BY,
    crNumeric: 0.25,
    hitPoints: "7 (2d6)",
    id: "goblin",
    isPublished: true,
    languages: ["Common", "Goblin"],
    name: "Goblin",
    nameNormalized: "goblin",
    passivePerception: 9,
    schemaVersion: SCHEMA_VERSION,
    senses: "darkvision 60 ft.",
    size: "Small",
    skills: { stealth: 6 },
    source: SOURCE,
    speed: "30 ft.",
    type: "humanoid (goblinoid)",
    updatedBy: CREATED_BY,
  },
  {
    abilityScores: { cha: 10, con: 16, dex: 12, int: 7, str: 16, wis: 11 },
    alignment: "chaotic evil",
    armorClass: "13 (hide armor)",
    challengeRating: "1/2",
    createdBy: CREATED_BY,
    crNumeric: 0.5,
    hitPoints: "15 (2d8 + 6)",
    id: "orc",
    isPublished: true,
    languages: ["Common", "Orc"],
    name: "Orc",
    nameNormalized: "orc",
    passivePerception: 10,
    schemaVersion: SCHEMA_VERSION,
    senses: "darkvision 60 ft.",
    size: "Medium",
    source: SOURCE,
    speed: "30 ft.",
    type: "humanoid (orc)",
    updatedBy: CREATED_BY,
  },
  {
    abilityScores: { cha: 5, con: 15, dex: 14, int: 6, str: 10, wis: 8 },
    alignment: "lawful evil",
    armorClass: "13 (armor scraps)",
    challengeRating: "1/4",
    createdBy: CREATED_BY,
    crNumeric: 0.25,
    hitPoints: "13 (2d8 + 4)",
    id: "skeleton",
    isPublished: true,
    name: "Skeleton",
    nameNormalized: "skeleton",
    passivePerception: 9,
    schemaVersion: SCHEMA_VERSION,
    senses: "darkvision 60 ft.",
    size: "Medium",
    source: SOURCE,
    speed: "30 ft.",
    type: "undead",
    updatedBy: CREATED_BY,
  },
  {
    abilityScores: { cha: 5, con: 16, dex: 6, int: 3, str: 13, wis: 6 },
    alignment: "neutral evil",
    armorClass: "8",
    challengeRating: "1/4",
    createdBy: CREATED_BY,
    crNumeric: 0.25,
    damageImmunities: ["poison"],
    conditionImmunities: ["poisoned"],
    hitPoints: "22 (3d8 + 9)",
    id: "zombie",
    isPublished: true,
    name: "Zombie",
    nameNormalized: "zombie",
    passivePerception: 8,
    schemaVersion: SCHEMA_VERSION,
    senses: "darkvision 60 ft.",
    size: "Medium",
    source: SOURCE,
    speed: "20 ft.",
    type: "undead",
    updatedBy: CREATED_BY,
  },
  {
    abilityScores: { cha: 7, con: 16, dex: 12, int: 3, str: 20, wis: 12 },
    alignment: "unaligned",
    armorClass: "13 (natural armor)",
    challengeRating: "3",
    createdBy: CREATED_BY,
    crNumeric: 3,
    hitPoints: "59 (7d10 + 21)",
    id: "owlbear",
    isPublished: true,
    name: "Owlbear",
    nameNormalized: "owlbear",
    passivePerception: 13,
    schemaVersion: SCHEMA_VERSION,
    senses: "darkvision 60 ft.",
    size: "Large",
    source: SOURCE,
    speed: "40 ft.",
    type: "monstrosity",
    updatedBy: CREATED_BY,
  },
  {
    abilityScores: { cha: 19, con: 21, dex: 10, int: 14, str: 23, wis: 11 },
    alignment: "chaotic evil",
    armorClass: "18 (natural armor)",
    challengeRating: "10",
    createdBy: CREATED_BY,
    crNumeric: 10,
    hitPoints: "178 (17d10 + 85)",
    id: "young-red-dragon",
    isPublished: true,
    languages: ["Common", "Draconic"],
    name: "Young Red Dragon",
    nameNormalized: "young red dragon",
    passivePerception: 17,
    schemaVersion: SCHEMA_VERSION,
    senses: "blindsight 30 ft., darkvision 120 ft.",
    size: "Large",
    source: SOURCE,
    speed: "40 ft., climb 40 ft., fly 80 ft.",
    type: "dragon",
    updatedBy: CREATED_BY,
  },
  {
    abilityScores: { cha: 1, con: 20, dex: 3, int: 1, str: 14, wis: 6 },
    alignment: "unaligned",
    armorClass: "6",
    challengeRating: "2",
    createdBy: CREATED_BY,
    crNumeric: 2,
    conditionImmunities: [
      "blinded",
      "charmed",
      "deafened",
      "exhaustion",
      "prone",
    ],
    hitPoints: "84 (8d10 + 40)",
    id: "gelatinous-cube",
    isPublished: true,
    name: "Gelatinous Cube",
    nameNormalized: "gelatinous cube",
    passivePerception: 8,
    schemaVersion: SCHEMA_VERSION,
    senses: "blindsight 60 ft. (blind beyond this radius)",
    size: "Large",
    source: SOURCE,
    speed: "15 ft.",
    type: "ooze",
    updatedBy: CREATED_BY,
  },
  {
    abilityScores: { cha: 14, con: 14, dex: 16, int: 14, str: 15, wis: 11 },
    alignment: "any non-lawful alignment",
    armorClass: "15 (studded leather)",
    challengeRating: "2",
    createdBy: CREATED_BY,
    crNumeric: 2,
    hitPoints: "65 (10d8 + 20)",
    id: "bandit-captain",
    isPublished: true,
    languages: ["Any two languages"],
    name: "Bandit Captain",
    nameNormalized: "bandit captain",
    passivePerception: 10,
    schemaVersion: SCHEMA_VERSION,
    size: "Medium",
    source: SOURCE,
    speed: "30 ft.",
    type: "humanoid (any race)",
    updatedBy: CREATED_BY,
  },
  {
    abilityScores: { cha: 4, con: 12, dex: 16, int: 2, str: 14, wis: 11 },
    alignment: "unaligned",
    armorClass: "14 (natural armor)",
    challengeRating: "1",
    createdBy: CREATED_BY,
    crNumeric: 1,
    hitPoints: "26 (4d10 + 4)",
    id: "giant-spider",
    isPublished: true,
    name: "Giant Spider",
    nameNormalized: "giant spider",
    passivePerception: 10,
    schemaVersion: SCHEMA_VERSION,
    senses: "blindsight 10 ft., darkvision 60 ft.",
    size: "Large",
    skills: { stealth: 7 },
    source: SOURCE,
    speed: "30 ft., climb 30 ft.",
    type: "beast",
    updatedBy: CREATED_BY,
  },
  {
    abilityScores: { cha: 8, con: 13, dex: 12, int: 5, str: 17, wis: 13 },
    alignment: "neutral",
    armorClass: "12 (natural armor)",
    challengeRating: "2",
    createdBy: CREATED_BY,
    crNumeric: 2,
    conditionImmunities: ["prone"],
    hitPoints: "58 (9d8 + 18)",
    id: "mimic",
    isPublished: true,
    name: "Mimic",
    nameNormalized: "mimic",
    passivePerception: 11,
    schemaVersion: SCHEMA_VERSION,
    senses: "darkvision 60 ft.",
    size: "Medium",
    skills: { stealth: 5 },
    source: SOURCE,
    speed: "15 ft.",
    type: "monstrosity (shapechanger)",
    updatedBy: CREATED_BY,
  },
];

type SeedSummary = {
  created: number;
  updated: number;
};

async function seedCollection<T extends { id: string }>(
  collectionName: "monsters" | "spells",
  entries: T[]
): Promise<SeedSummary> {
  const { getAdminDb } = await import("../lib/firebase-admin");

  const db = getAdminDb();
  const refs = entries.map((entry) =>
    db.collection(collectionName).doc(entry.id)
  );
  const snapshots = await db.getAll(...refs);
  const batch = db.batch();
  let created = 0;
  let updated = 0;

  for (const [index, entry] of entries.entries()) {
    const ref = refs[index];
    const snapshot = snapshots[index];
    if (!ref || !snapshot) {
      continue;
    }

    if (snapshot.exists) {
      const existingCreatedAt =
        snapshot.get("createdAt") ?? FieldValue.serverTimestamp();
      batch.set(ref, {
        ...entry,
        createdAt: existingCreatedAt,
        updatedAt: FieldValue.serverTimestamp(),
      });
      updated += 1;
      continue;
    }

    batch.set(ref, {
      ...entry,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    created += 1;
  }

  await batch.commit();
  return { created, updated };
}

async function main() {
  loadEnvConfig(process.cwd());
  const { getAdminDb, hasRequiredServerFirebaseConfig } =
    await import("../lib/firebase-admin");

  if (!hasRequiredServerFirebaseConfig) {
    throw new Error(
      "Missing Firestore server env. Set FIREBASE_PROJECT_ID and service credentials if required."
    );
  }

  const validatedSpells = spells.map((spell) => spellWriteSchema.parse(spell));
  const validatedMonsters = monsters.map((monster) =>
    monsterWriteSchema.parse(monster)
  );

  const spellSummary = await seedCollection("spells", validatedSpells);
  const monsterSummary = await seedCollection("monsters", validatedMonsters);

  const db = getAdminDb();
  await db
    .collection("meta")
    .doc("collections")
    .set(
      {
        monstersVersion: FieldValue.increment(
          monsterSummary.created + monsterSummary.updated
        ),
        spellsVersion: FieldValue.increment(
          spellSummary.created + spellSummary.updated
        ),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  console.log("Seed complete.");
  console.log("Spells:", spellSummary);
  console.log("Monsters:", monsterSummary);
}

main().catch((error: unknown) => {
  console.error("Seed failed.", error);
  process.exitCode = 1;
});
