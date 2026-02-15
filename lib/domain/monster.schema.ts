import { z } from "zod";

const monsterSizeSchema = z.enum([
  "Tiny",
  "Small",
  "Medium",
  "Large",
  "Huge",
  "Gargantuan",
]);

const abilityScoresSchema = z.object({
  cha: z.number().int(),
  con: z.number().int(),
  dex: z.number().int(),
  int: z.number().int(),
  str: z.number().int(),
  wis: z.number().int(),
});

const namedTextSchema = z.object({
  name: z.string().min(1),
  text: z.string().min(1),
});

const actionSchema = namedTextSchema.extend({
  attack: z.array(z.string()).optional(),
});

const commonMonsterFieldsSchema = z.object({
  abilityScores: abilityScoresSchema,
  actions: z.array(actionSchema).optional(),
  alignment: z.string().min(1),
  armorClass: z.string().min(1),
  challengeRating: z.string().min(1),
  conditionImmunities: z.array(z.string()).optional(),
  crNumeric: z.number().nonnegative(),
  damageImmunities: z.array(z.string()).optional(),
  damageResistances: z.array(z.string()).optional(),
  hitPoints: z.string().min(1),
  languages: z.array(z.string()).optional(),
  legendaryActions: z.array(namedTextSchema).optional(),
  name: z.string().min(1),
  nameNormalized: z.string().min(1),
  passivePerception: z.number().int().optional(),
  reactions: z.array(namedTextSchema).optional(),
  savingThrows: z.record(z.string(), z.number().int()).optional(),
  schemaVersion: z.number().int().positive(),
  searchTokens: z.array(z.string()).optional(),
  senses: z.string().optional(),
  size: monsterSizeSchema,
  skills: z.record(z.string(), z.number().int()).optional(),
  source: z.string().min(1),
  specialAbilities: z.array(namedTextSchema).optional(),
  speed: z.string().min(1),
  spellList: z.array(z.string()).optional(),
  spellSlots: z.array(z.number().int()).optional(),
  type: z.string().min(1),
});

export const monsterSchema = commonMonsterFieldsSchema.extend({
  createdAt: z.string().datetime(),
  createdBy: z.string().min(1),
  id: z.string().min(1),
  isPublished: z.boolean(),
  updatedAt: z.string().datetime(),
  updatedBy: z.string().min(1),
});

export const monsterWriteSchema = commonMonsterFieldsSchema.extend({
  createdBy: z.string().min(1),
  id: z.string().min(1),
  isPublished: z.boolean(),
  updatedBy: z.string().min(1),
});

export type Monster = z.infer<typeof monsterSchema>;
export type MonsterWriteInput = z.infer<typeof monsterWriteSchema>;
