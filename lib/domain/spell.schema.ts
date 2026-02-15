import { z } from "zod";

const spellSchoolSchema = z.enum([
  "abjuration",
  "conjuration",
  "divination",
  "enchantment",
  "evocation",
  "illusion",
  "necromancy",
  "transmutation",
]);

const componentsSchema = z.object({
  material: z.boolean(),
  materialText: z.string().optional(),
  somatic: z.boolean(),
  verbal: z.boolean(),
});

const commonSpellFieldsSchema = z.object({
  attackType: z.enum(["melee", "ranged"]).optional(),
  castingTime: z.string().min(1),
  classes: z.array(z.string()),
  components: componentsSchema,
  concentration: z.boolean(),
  damage: z
    .object({
      cantripScaling: z.record(z.string(), z.string()).optional(),
      diceBySlot: z.record(z.string(), z.string()).optional(),
      type: z.string().min(1),
    })
    .optional(),
  description: z.array(z.string()),
  duration: z.string().min(1),
  gpCost: z.number().int().nonnegative().optional(),
  higherLevel: z.array(z.string()).optional(),
  level: z.number().int().min(0).max(9),
  name: z.string().min(1),
  nameNormalized: z.string().min(1),
  publisher: z.string().min(1).optional(),
  range: z.string().min(1),
  ritual: z.boolean(),
  save: z
    .object({
      ability: z.enum(["str", "dex", "con", "int", "wis", "cha"]),
      onSuccess: z.string().optional(),
    })
    .optional(),
  schemaVersion: z.number().int().positive(),
  school: spellSchoolSchema,
  searchTokens: z.array(z.string()).optional(),
  source: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

export const spellSchema = commonSpellFieldsSchema.extend({
  createdAt: z.string().datetime(),
  createdBy: z.string().min(1),
  id: z.string().min(1),
  isPublished: z.boolean(),
  updatedAt: z.string().datetime(),
  updatedBy: z.string().min(1),
});

export const spellWriteSchema = commonSpellFieldsSchema.extend({
  createdBy: z.string().min(1),
  id: z.string().min(1),
  isPublished: z.boolean(),
  updatedBy: z.string().min(1),
});

export type Spell = z.infer<typeof spellSchema>;
export type SpellWriteInput = z.infer<typeof spellWriteSchema>;
