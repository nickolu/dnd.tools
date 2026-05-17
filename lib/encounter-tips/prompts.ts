import type { TipsRequestPayload } from "./types";

export const ENCOUNTER_TIPS_SYSTEM_PROMPT = `You are a D&D 5e (2024 rules) Dungeon Master's assistant. The user is preparing an encounter and wants concrete, table-ready ideas to make it more engaging.

Return ONLY valid JSON with this exact shape, no additional commentary:
{
  "terrainIdeas": [string, string, ...],          // 2-5 short, evocative terrain prompts (e.g. "Slick algae-covered stones reduce movement to half speed")
  "environmentalHazards": [string, string, ...],  // 2-5 hazards keyed to the monsters (e.g. "Collapsing scaffolding triggered by 10+ damage to a wooden support")
  "mechanicSuggestions": [string, string, ...],   // 2-5 fight-specific mechanics that synergize with the enemy abilities
  "tacticalNotes": string                          // 2-4 short paragraphs of overall tactical guidance for running the encounter
}

Be specific. Reference the monsters by name when relevant. Keep individual list entries to one or two sentences. Avoid generic advice ("be creative", "vary terrain").`;

export function buildEncounterTipsPrompt(input: TipsRequestPayload): string {
  const partyLine = `Party: ${input.party.size} PC${
    input.party.size === 1 ? "" : "s"
  }, levels [${input.party.levels.join(", ")}].`;
  const difficultyLine = `Target difficulty: ${input.difficulty}.`;
  const monsterLines = input.combatants
    .map((c) => {
      const countSuffix = c.count > 1 ? ` ×${c.count}` : "";
      const traits =
        c.keyTraits.length > 0 ? ` — Notable: ${c.keyTraits.join("; ")}` : "";
      return `- ${c.name}${countSuffix} (CR ${c.cr}, ${c.size} ${c.type})${traits}`;
    })
    .join("\n");
  return [
    partyLine,
    difficultyLine,
    `Ruleset: ${input.ruleset}.`,
    "",
    "Enemy roster:",
    monsterLines,
    "",
    "Return JSON in the exact shape specified.",
  ].join("\n");
}
