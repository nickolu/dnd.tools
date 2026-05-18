import { z } from "zod";

export const encounterRulesetSchema = z.enum(["basic", "advanced"]);
export const combatantSideSchema = z.enum(["ally", "enemy"]);

export const CONDITIONS = [
  "blinded",
  "charmed",
  "deafened",
  "exhaustion",
  "frightened",
  "grappled",
  "incapacitated",
  "invisible",
  "paralyzed",
  "petrified",
  "poisoned",
  "prone",
  "restrained",
  "stunned",
] as const;

export const conditionSchema = z.enum(CONDITIONS);
export type Condition = z.infer<typeof conditionSchema>;

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const encounterMapSchema = z.object({
  grid: z.literal("square"),
  cols: z.number().int().min(4).max(60),
  rows: z.number().int().min(4).max(60),
  cellSize: z.number().int().min(24).max(96),
  backgroundUrl: z.string().url().optional(),
});

export const encounterTipsSchema = z.object({
  terrainIdeas: z.array(z.string()),
  environmentalHazards: z.array(z.string()),
  mechanicSuggestions: z.array(z.string()),
  tacticalNotes: z.string(),
});

export const initiativeStateSchema = z.object({
  round: z.number().int().positive(),
  activeIndex: z.number().int().nullable(),
});

export const partyMemberSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("pc"),
  name: z.string().min(1),
  level: z.number().int().min(1).max(20),
  initiativeMod: z.number().int(),
  initiative: z.number().int().nullable(),
  position: positionSchema.optional(),
  notes: z.string().optional(),
  conditions: z.array(conditionSchema).default([]),
  maxHp: z.number().int().positive().optional(),
  currentHp: z.number().int().min(0).optional(),
});

export const combatantSchema = z.object({
  id: z.string().min(1),
  monsterId: z.string().min(1),
  monsterName: z.string().min(1),
  monsterCrNumeric: z.number().nonnegative(),
  side: combatantSideSchema,
  nameOverride: z.string().optional(),
  maxHp: z.number().int().positive(),
  currentHp: z.number().int(),
  initiative: z.number().int().nullable(),
  position: positionSchema.optional(),
  conditions: z.array(conditionSchema).default([]),
});

export const encounterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  ruleset: encounterRulesetSchema,
  partyMembers: z.array(partyMemberSchema),
  combatants: z.array(combatantSchema),
  initiative: initiativeStateSchema,
  tips: encounterTipsSchema.nullable(),
  tipsGeneratedAt: z.number().nullable(),
  map: encounterMapSchema.optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type EncounterRuleset = z.infer<typeof encounterRulesetSchema>;
export type CombatantSide = z.infer<typeof combatantSideSchema>;
export type EncounterTips = z.infer<typeof encounterTipsSchema>;
export type EncounterMap = z.infer<typeof encounterMapSchema>;
export type InitiativeState = z.infer<typeof initiativeStateSchema>;
export type Position = z.infer<typeof positionSchema>;
export type PartyMember = z.infer<typeof partyMemberSchema>;
export type Combatant = z.infer<typeof combatantSchema>;
export type Encounter = z.infer<typeof encounterSchema>;
