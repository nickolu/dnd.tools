import { z } from "zod";

import { collectionVersionSchema } from "@/lib/domain/meta.schema";
import { monsterSchema } from "@/lib/domain/monster.schema";
import { spellSchema } from "@/lib/domain/spell.schema";

const apiSuccessSchema = z.object({
  data: z.unknown(),
  ok: z.literal(true),
});

const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
  ok: z.literal(false),
});

const apiEnvelopeSchema = z.union([apiSuccessSchema, apiErrorSchema]);

const parseResponse = async (response: Response): Promise<unknown> => {
  const payload = apiEnvelopeSchema.parse(await response.json());

  if (!payload.ok) {
    throw new Error(`${payload.error.code}: ${payload.error.message}`);
  }

  return payload.data;
};

const getJson = async <T>(path: string, schema: z.ZodType<T>): Promise<T> => {
  const response = await fetch(path, {
    cache: "no-store",
  });

  return schema.parse(await parseResponse(response));
};

export const apiClient = {
  getMetaVersion: () => getJson("/api/meta/version", collectionVersionSchema),
  getMonster: (id: string) => getJson(`/api/monsters/${id}`, monsterSchema),
  getMonsters: () => getJson("/api/monsters", z.array(monsterSchema)),
  getSpell: (id: string) => getJson(`/api/spells/${id}`, spellSchema),
  getSpells: () => getJson("/api/spells", z.array(spellSchema)),
};
