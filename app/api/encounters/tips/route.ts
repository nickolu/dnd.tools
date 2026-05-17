import { type NextRequest } from "next/server";
import { z } from "zod";

import { API_ERROR_CODES, jsonError, jsonSuccess } from "@/lib/api/envelope";
import {
  buildEncounterTipsPrompt,
  ENCOUNTER_TIPS_SYSTEM_PROMPT,
} from "@/lib/encounter-tips/prompts";
import { requestNarrativeFromOpenAi } from "@/lib/mausritter/openai";

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const MAX_COMBATANTS = 40;
const MAX_PARTY_SIZE = 12;
const MAX_KEY_TRAITS = 8;

const difficultySchema = z.enum([
  "Mild",
  "Bruising",
  "Bloody",
  "Brutal",
  "Oppressive",
  "Overwhelming",
  "Crushing",
  "Devastating",
  "Impossible",
]);

const requestSchema = z.object({
  party: z.object({
    size: z.number().int().min(1).max(MAX_PARTY_SIZE),
    levels: z.array(z.number().int().min(1).max(20)).min(1).max(MAX_PARTY_SIZE),
  }),
  difficulty: difficultySchema,
  combatants: z
    .array(
      z.object({
        monsterId: z.string().min(1),
        name: z.string().min(1),
        cr: z.string().min(1),
        size: z.string().min(1),
        type: z.string().min(1),
        count: z.number().int().positive(),
        keyTraits: z.array(z.string()).max(MAX_KEY_TRAITS),
      })
    )
    .min(1)
    .max(MAX_COMBATANTS),
  ruleset: z.enum(["5e-2014", "5e-2024"]).default("5e-2024"),
});

const tipsResponseSchema = z.object({
  terrainIdeas: z.array(z.string()).min(2).max(5),
  environmentalHazards: z.array(z.string()).min(2).max(5),
  mechanicSuggestions: z.array(z.string()).min(2).max(5),
  tacticalNotes: z.string().min(1),
});

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return jsonError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "OPENAI_API_KEY is not configured. Encounter tips are unavailable.",
      503
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        API_ERROR_CODES.VALIDATION_ERROR,
        "Invalid encounter tips payload.",
        400,
        parsed.error.flatten()
      );
    }

    const userPrompt = buildEncounterTipsPrompt(parsed.data);
    const raw = await requestNarrativeFromOpenAi({
      apiKey: OPENAI_API_KEY,
      model: OPENAI_MODEL,
      systemPrompt: ENCOUNTER_TIPS_SYSTEM_PROMPT,
      userPrompt,
    });

    const tips = tipsResponseSchema.safeParse(raw);
    if (!tips.success) {
      return jsonError(
        API_ERROR_CODES.VALIDATION_ERROR,
        "LLM returned unexpected format.",
        500,
        tips.error.flatten()
      );
    }

    return jsonSuccess(tips.data);
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Failed to generate tips.";
    return jsonError(API_ERROR_CODES.INTERNAL_ERROR, message, 500);
  }
}
