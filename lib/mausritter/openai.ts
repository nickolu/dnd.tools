import { z } from "zod";

import { API_ERROR_CODES } from "@/lib/api/envelope";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const parseOpenAiError = async (response: Response): Promise<string> => {
  try {
    const body = await response.json();
    const result = z
      .object({ error: z.object({ message: z.string() }) })
      .safeParse(body);

    if (result.success) {
      return result.data.error.message;
    }
  } catch {
    // Fall through to generic message.
  }
  return "OpenAI request failed.";
};

type NarrativeParams = {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
};

export const requestNarrativeFromOpenAi = async ({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
}: NarrativeParams): Promise<Record<string, unknown>> => {
  const response = await fetch(OPENAI_URL, {
    body: JSON.stringify({
      messages: [
        { content: systemPrompt, role: "system" },
        { content: userPrompt, role: "user" },
      ],
      model,
      response_format: { type: "json_object" },
      temperature: 0.8,
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

  const parsed: unknown = JSON.parse(content);
  if (!isRecord(parsed)) {
    throw new Error(
      `${API_ERROR_CODES.VALIDATION_ERROR}:LLM output must be a JSON object.`
    );
  }

  return parsed;
};
