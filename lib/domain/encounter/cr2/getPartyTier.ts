import type { PartyMember } from "../encounter.schema";
import type { PartyTier } from "./types";

/**
 * Party tier is derived from the highest PC level. Max-level (not average)
 * is the conservative choice: a single high-level PC dictates encounter risk
 * because their tools scale faster than averaging would suggest.
 */
export function getPartyTier(partyMembers: PartyMember[]): PartyTier {
  if (partyMembers.length === 0) return 1;
  const maxLevel = Math.max(...partyMembers.map((p) => p.level));
  if (maxLevel <= 4) return 1;
  if (maxLevel <= 10) return 2;
  if (maxLevel <= 16) return 3;
  return 4;
}
