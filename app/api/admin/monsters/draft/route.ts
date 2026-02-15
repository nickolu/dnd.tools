import { type NextRequest } from "next/server";
import { z } from "zod";

import {
  extractFieldFromRawText,
  requestDraftFromOpenAi,
  toNameNormalized,
  toSlug,
} from "@/lib/admin/ingest";
import { canWrite } from "@/lib/api/auth";
import {
  API_ERROR_CODES,
  jsonError,
  jsonSuccess,
} from "@/lib/api/envelope";
import { monsterWriteSchema } from "@/lib/domain/monster.schema";

const requestSchema = z.object({
  actor: z.string().trim().min(1).default("admin-ui"),
  isPublished: z.boolean().default(false),
  rawText: z.string().trim().min(1),
  schemaVersion: z.number().int().positive().default(1),
  source: z.string().trim().min(1).default("Unknown"),
});

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const MONSTER_PROMPT = `
Extract one D&D 5e monster as JSON with these keys:
- name (string)
- size (Tiny|Small|Medium|Large|Huge|Gargantuan)
- type (string)
- alignment (string)
- armorClass (string)
- hitPoints (string)
- speed (string)
- challengeRating (string, like "1/2")
- crNumeric (number, like 0.5)
- proficiencyBonus (integer, optional if unknown)
- source (string)
- abilityScores (object with integer keys str,dex,con,int,wis,cha)
Optional keys:
- savingThrows (object string->integer)
- skills (object string->integer)
- senses (string)
- passivePerception (integer)
- languages (string array)
- damageImmunities (string array)
- damageResistances (string array)
- damageVulnerabilities (string array)
- conditionImmunities (string array)
- spellList (string array)
- spellSlots (integer array)
- specialAbilities (array of {name, text})
- actions (array of {name, text, optional attack: string[]})
- reactions (array of {name, text})
- legendaryActions (array of {name, text})
- searchTokens (string array)
Do not include explanatory text.
`;

export async function POST(request: NextRequest) {
  if (!canWrite(request)) {
    return jsonError(
      API_ERROR_CODES.FORBIDDEN,
      "Write access requires admin/editor role.",
      403
    );
  }

  if (!OPENAI_API_KEY) {
    return jsonError(
      API_ERROR_CODES.INTERNAL_ERROR,
      "OPENAI_API_KEY is not configured.",
      503
    );
  }

  try {
    const body = await request.json();
    const parsedBody = requestSchema.safeParse(body);

    if (!parsedBody.success) {
      return jsonError(
        API_ERROR_CODES.VALIDATION_ERROR,
        "Invalid draft request payload.",
        400,
        parsedBody.error.flatten()
      );
    }

    const llmDraft = await requestDraftFromOpenAi({
      apiKey: OPENAI_API_KEY,
      model: OPENAI_MODEL,
      prompt: MONSTER_PROMPT,
      rawText: parsedBody.data.rawText,
    });

    const name = String(llmDraft.name ?? "").trim();
    const id = String(llmDraft.id ?? "").trim() || toSlug(name);
    const sourceFromRawText =
      extractFieldFromRawText(parsedBody.data.rawText, "source") ??
      extractFieldFromRawText(parsedBody.data.rawText, "book");
    const normalizedDraft = {
      ...llmDraft,
      createdBy: parsedBody.data.actor,
      id,
      isPublished: parsedBody.data.isPublished,
      name,
      nameNormalized: toNameNormalized(name),
      schemaVersion: parsedBody.data.schemaVersion,
      source:
        String(llmDraft.source ?? "").trim() ||
        sourceFromRawText ||
        parsedBody.data.source,
      updatedBy: parsedBody.data.actor,
    };

    const validated = monsterWriteSchema.safeParse(normalizedDraft);

    return jsonSuccess({
      draft: normalizedDraft,
      isValid: validated.success,
      validationErrors: validated.success
        ? null
        : validated.error.flatten(),
    });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate monster draft.";
    return jsonError(API_ERROR_CODES.INTERNAL_ERROR, message, 500);
  }
}
