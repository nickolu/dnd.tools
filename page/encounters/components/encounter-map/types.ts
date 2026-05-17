import type { TokenKind } from "@/lib/store/useEncounterLibraryStore";

export type TokenRef = {
  kind: TokenKind;
  id: string;
};

export type TokenViewModel = TokenRef & {
  name: string;
  side: "pc" | "ally" | "enemy";
  currentHp: number | null;
  maxHp: number | null;
};
