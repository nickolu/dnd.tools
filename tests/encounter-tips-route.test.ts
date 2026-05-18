import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/encounters/tips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function validRequestBody() {
  return {
    party: { size: 4, levels: [5, 5, 5, 5] },
    difficulty: "Brutal",
    combatants: [
      {
        monsterId: "m-goblin",
        name: "Goblin",
        cr: "1/4",
        size: "Small",
        type: "humanoid",
        count: 4,
        keyTraits: [],
      },
    ],
    ruleset: "5e-2024",
  };
}

function mockOpenAiSuccess(payload: object) {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(payload) } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
    )
  );
}

describe("POST /api/encounters/tips", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns 503 when OPENAI_API_KEY is not configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const { POST } = await import("@/app/api/encounters/tips/route");

    const response = await POST(makeRequest(validRequestBody()));
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("returns 400 on malformed body", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const { POST } = await import("@/app/api/encounters/tips/route");

    const response = await POST(makeRequest({ party: { size: 0 } }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when combatants array is empty", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const { POST } = await import("@/app/api/encounters/tips/route");

    const body = validRequestBody();
    body.combatants = [];
    const response = await POST(makeRequest(body));
    expect(response.status).toBe(400);
  });

  it("returns 400 when combatants exceed cap (41)", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const { POST } = await import("@/app/api/encounters/tips/route");

    const body = validRequestBody();
    const proto = body.combatants[0]!;
    body.combatants = Array.from({ length: 41 }, (_, i) => ({
      ...proto,
      monsterId: `m-${i}`,
    }));
    const response = await POST(makeRequest(body));
    expect(response.status).toBe(400);
  });

  it("returns 200 with envelope on a valid response", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    mockOpenAiSuccess({
      terrainIdeas: ["a", "b"],
      environmentalHazards: ["c", "d"],
      mechanicSuggestions: ["e", "f"],
      tacticalNotes: "Lead with the goblins flanking.",
      puzzles: ["g", "h"],
      roleplayingHooks: ["i", "j"],
    });
    const { POST } = await import("@/app/api/encounters/tips/route");

    const response = await POST(makeRequest(validRequestBody()));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.terrainIdeas).toEqual(["a", "b"]);
    expect(body.data.tacticalNotes).toContain("goblins");
  });

  it("returns 500 with VALIDATION_ERROR when LLM returns wrong shape", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    mockOpenAiSuccess({ terrainIdeas: ["only-one"] }); // missing required fields
    const { POST } = await import("@/app/api/encounters/tips/route");

    const response = await POST(makeRequest(validRequestBody()));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
