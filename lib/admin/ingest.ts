import { z } from "zod";

import { API_ERROR_CODES } from "@/lib/api/envelope";

const openAiResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().nullable(),
        }),
      })
    )
    .min(1),
});

type RequestDraftParams = {
  apiKey: string;
  model: string;
  prompt: string;
  rawText: string;
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const normalizeWhitespace = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

export const toSlug = (value: string): string =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const toNameNormalized = (value: string): string =>
  normalizeWhitespace(value).toLowerCase();

export const extractFieldFromRawText = (
  rawText: string,
  fieldName: string
): string | null => {
  const escapedField = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(?:^|\\n)\\s*${escapedField}\\s*:\\s*(.+)$`,
    "im"
  );
  const match = rawText.match(pattern);
  const value = match?.[1]?.trim();
  return value ? value : null;
};

const parseOpenAiError = async (response: Response): Promise<string> => {
  try {
    const body = await response.json();
    const message = z
      .object({
        error: z.object({
          message: z.string(),
        }),
      })
      .safeParse(body);

    if (message.success) {
      return message.data.error.message;
    }
  } catch {
    // Ignore parse failures and fall through to generic message.
  }

  return "OpenAI request failed.";
};

export const requestDraftFromOpenAi = async ({
  apiKey,
  model,
  prompt,
  rawText,
}: RequestDraftParams): Promise<Record<string, unknown>> => {
  const response = await fetch(OPENAI_URL, {
    body: JSON.stringify({
      messages: [
        {
          content:
            "You are a D&D 5e data extraction assistant. Return JSON only.",
          role: "system",
        },
        {
          content: `${prompt}\n\nRaw text:\n${rawText}`,
          role: "user",
        },
      ],
      model,
      response_format: { type: "json_object" },
      temperature: 0,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const message = await parseOpenAiError(response);
    throw new Error(`${API_ERROR_CODES.INTERNAL_ERROR}:${message}`);
  }

  const json = openAiResponseSchema.parse(await response.json());
  const content = json.choices[0]?.message.content;

  if (!content) {
    throw new Error(`${API_ERROR_CODES.INTERNAL_ERROR}:Empty LLM response.`);
  }

  const parsedContent = JSON.parse(content);
  if (!isRecord(parsedContent)) {
    throw new Error(
      `${API_ERROR_CODES.VALIDATION_ERROR}:LLM output must be a JSON object.`
    );
  }

  return parsedContent;
};
