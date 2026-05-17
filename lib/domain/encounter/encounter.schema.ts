import { z } from "zod";

export const encounterRulesetSchema = z.enum(["basic", "advanced"]);
export const combatantSideSchema = z.enum(["ally", "enemy"]);

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const partyMemberSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("pc"),
  name: z.string().min(1),
  level: z.number().int().min(1).max(20),
  notes: z.string().optional(),
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
  position: positionSchema.optional(),
});

export const encounterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  ruleset: encounterRulesetSchema,
  partyMembers: z.array(partyMemberSchema),
  combatants: z.array(combatantSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
  schemaVersion: z.literal(1),
});

export type EncounterRuleset = z.infer<typeof encounterRulesetSchema>;
export type CombatantSide = z.infer<typeof combatantSideSchema>;
export type PartyMember = z.infer<typeof partyMemberSchema>;
export type Combatant = z.infer<typeof combatantSchema>;
export type Encounter = z.infer<typeof encounterSchema>;
