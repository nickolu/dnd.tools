import { type NextRequest } from "next/server";
import { z } from "zod";

import { API_ERROR_CODES, jsonError, jsonSuccess } from "@/lib/api/envelope";
import { requestNarrativeFromOpenAi } from "@/lib/mausritter/openai";
import { buildLorePrompt, SYSTEM_PROMPT } from "@/lib/mausritter/prompts";

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const npcSchema = z.object({
  name: z.string(),
  socialPosition: z.string(),
  disposition: z.string(),
  appearance: z.string(),
  quirk: z.string(),
  wants: z.string(),
});

const tavernSchema = z
  .object({
    name: z.string(),
    specialtyMeal: z.string(),
  })
  .nullable()
  .optional();

const settlementSchema = z
  .object({
    name: z.string(),
    size: z.string(),
    governance: z.string(),
    detail: z.string(),
    industries: z.array(z.string()),
    event: z.string(),
    tavern: tavernSchema,
    npcs: z.array(npcSchema),
  })
  .nullable()
  .optional();

const adventureSiteSchema = z
  .object({
    construction: z.string(),
    inhabitants: z.string(),
    ruination: z.string(),
    searchingFor: z.string(),
    secret: z.string(),
    roomCount: z.number(),
  })
  .nullable()
  .optional();

const hexSchema = z.object({
  index: z.number(),
  hexType: z.string(),
  landmark: z.string(),
  landmarkDetail: z.string(),
  settlement: settlementSchema,
  adventureSite: adventureSiteSchema,
});

const factionSchema = z.object({
  name: z.string(),
  resources: z.array(z.string()),
  goals: z.array(z.object({ description: z.string() })),
});

const requestSchema = z.object({
  hexes: z.array(hexSchema),
  factions: z.array(factionSchema),
});

const loreResponseSchema = z.object({
  overview: z.string(),
  factionPolitics: z.string(),
  notableCharacters: z.string(),
  adventureHooks: z.string(),
  notableLocations: z.string(),
});

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return jsonError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "OPENAI_API_KEY is not configured. LLM lore generation is unavailable.",
      503
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(
        API_ERROR_CODES.VALIDATION_ERROR,
        "Invalid lore request payload.",
        400,
        parsed.error.flatten()
      );
    }

    const { hexes, factions } = parsed.data;
    const userPrompt = buildLorePrompt(hexes, factions);

    const raw = await requestNarrativeFromOpenAi({
      apiKey: OPENAI_API_KEY,
      model: OPENAI_MODEL,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    });

    const lore = loreResponseSchema.safeParse(raw);

    if (!lore.success) {
      return jsonError(
        API_ERROR_CODES.VALIDATION_ERROR,
        "LLM returned unexpected format.",
        500,
        lore.error.flatten()
      );
    }

    return jsonSuccess(lore.data);
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Failed to generate lore.";
    return jsonError(API_ERROR_CODES.INTERNAL_ERROR, message, 500);
  }
}
