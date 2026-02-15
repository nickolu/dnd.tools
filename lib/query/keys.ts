export const queryKeys = {
  metaVersion: ["meta", "version"] as const,
  monster: (id: string) => ["monsters", id] as const,
  monsters: ["monsters"] as const,
  spell: (id: string) => ["spells", id] as const,
  spells: ["spells"] as const,
};
