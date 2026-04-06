export type HexSummary = {
  index: number;
  hexType: string;
  landmark: string;
  landmarkDetail: string;
  settlement?: {
    name: string;
    size: string;
    governance: string;
    detail: string;
    industries: string[];
    event: string;
    tavern?: { name: string; specialtyMeal: string } | null | undefined;
    npcs: {
      name: string;
      socialPosition: string;
      disposition: string;
      appearance: string;
      quirk: string;
      wants: string;
    }[];
  } | null | undefined;
  adventureSite?: {
    construction: string;
    inhabitants: string;
    ruination: string;
    searchingFor: string;
    secret: string;
    roomCount: number;
  } | null | undefined;
};

export type FactionSummary = {
  name: string;
  resources: string[];
  goals: { description: string }[];
};

export const SYSTEM_PROMPT = `You are a Mausritter RPG world-builder and narrator. Mausritter is a tabletop RPG about brave mice adventuring in a dangerous world where they are tiny — cats are apex predators, owls are silent terrors, a garden is a vast wilderness, and a kitchen is a deadly dungeon. Mice live in small settlements, trade in pips (pennies), and face threats from beasts, weather, and rival factions.

Write evocative, concise prose rich with sensory details. Tone: cozy peril — the world is wondrous and full of small beauties, but also lethal and unforgiving. Think Redwall meets Dark Souls meets The Wind in the Willows.

Return JSON only.`;

function serializeHex(hex: HexSummary): string {
  const parts: string[] = [
    `Hex ${hex.index} (${hex.hexType}): ${hex.landmark}. "${hex.landmarkDetail}"`,
  ];

  if (hex.settlement) {
    const s = hex.settlement;
    const npcList = s.npcs
      .map((n) => `${n.name} (${n.socialPosition}, ${n.appearance}, ${n.quirk}, wants ${n.wants})`)
      .join("; ");
    parts.push(
      `  Settlement "${s.name}" — ${s.size}, ${s.governance}. Detail: ${s.detail}. Industries: ${s.industries.join(", ")}. Event: ${s.event}.${s.tavern ? ` Tavern: "${s.tavern.name}" (specialty: ${s.tavern.specialtyMeal}).` : ""} NPCs: ${npcList || "none"}`
    );
  }

  if (hex.adventureSite) {
    const a = hex.adventureSite;
    parts.push(
      `  Adventure Site — ${a.construction}, inhabited by ${a.inhabitants}. Ruination: ${a.ruination}. Searching for: ${a.searchingFor}. Secret: ${a.secret}. ${a.roomCount} rooms.`
    );
  }

  return parts.join("\n");
}

function serializeFaction(f: FactionSummary): string {
  const goals = f.goals.map((g) => g.description).join("; ");
  return `${f.name} — Resources: ${f.resources.join(", ")}. Goals: ${goals}`;
}

export function buildLorePrompt(
  hexes: HexSummary[],
  factions: FactionSummary[]
): string {
  const hexBlock = hexes.map(serializeHex).join("\n");
  const factionBlock = factions.map(serializeFaction).join("\n");

  return `Below is the mechanical output of a randomly generated Mausritter hex crawl. Your job is to weave all of these disparate elements into a coherent, evocative world that a Game Master can use at the table.

FACTIONS:
${factionBlock}

HEX CRAWL (${hexes.length} hexes):
${hexBlock}

Generate a JSON object with these 5 keys, each containing 2-4 paragraphs of prose:

1. "overview" — Describe the region as a whole. What does it feel like to travel through? What's the climate, the mood, the dominant features? Give it a name if one suggests itself.

2. "factionPolitics" — How do the factions relate to each other and to the settlements? What tensions simmer? Who is allied, who is at odds, and why?

3. "notableCharacters" — Pick out the most interesting NPCs and weave them into the world. What are they known for? How do they connect to each other, to factions, or to locations?

4. "adventureHooks" — Provide 3-5 specific adventure hooks that a GM could use as session starters. Each should reference specific hexes, NPCs, factions, or locations from the data. Format as a numbered list within the string.

5. "notableLocations" — Which hexes, settlements, or adventure sites stand out? Describe what makes them memorable and dangerous.

Weave connections between elements. If a faction's goal relates to a settlement's industry, mention it. If an NPC's wants align with a faction's resources, tie them together. The goal is a living, breathing world — not isolated descriptions.`;
}

export function buildLocationLorePrompt(
  hex: HexSummary,
  generalLore: string | null
): string {
  const hexBlock = serializeHex(hex);

  const contextBlock = generalLore
    ? `\nESTABLISHED WORLD LORE (your location description must be consistent with this):\n${generalLore}\n`
    : "";

  return `Below is the mechanical data for a single hex location in a Mausritter hex crawl. Write a vivid, detailed description of this location that a Game Master can read aloud or reference during play.
${contextBlock}
LOCATION DATA:
${hexBlock}

Generate a JSON object with a single key:

"locationLore" — A 2-4 paragraph narrative description of this hex location. Describe what the mice see, hear, and smell as they arrive. If there's a settlement, bring it to life — the bustle of its streets, the character of its governance, what the tavern feels like. If there's an adventure site, hint at its dangers and mysteries. Mention NPCs by name and give them personality beyond their mechanical traits. If established world lore was provided, reference it naturally — mention faction influence, ongoing events, or connections to other locations where appropriate. Do not contradict the established lore.`;
}
