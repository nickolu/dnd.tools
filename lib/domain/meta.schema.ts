import { z } from "zod";

export const collectionVersionSchema = z.object({
  monstersVersion: z.number().int().nonnegative(),
  spellsVersion: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
});

export type CollectionVersion = z.infer<typeof collectionVersionSchema>;
