import { useHexCrawlStore } from "../hooks/useHexCrawlStore";
import type { GeneratedLore } from "../types";

const LORE_SECTIONS: { key: keyof GeneratedLore; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "factionPolitics", label: "Faction Politics" },
  { key: "notableCharacters", label: "Notable Characters" },
  { key: "adventureHooks", label: "Adventure Hooks" },
  { key: "notableLocations", label: "Notable Locations" },
];

export function LorePanel() {
  const { lore, loreLoading, loreError, generateLore } = useHexCrawlStore();

  if (!lore && !loreLoading && !loreError) {
    return (
      <div className="surface-card p-6 text-center">
        <p className="text-secondary text-sm mb-3">
          Use AI to weave the hex crawl data into a rich narrative with faction
          politics, character connections, and adventure hooks.
        </p>
        <button
          className="rounded-lg bg-amber-700/80 px-5 py-2 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-700"
          onClick={() => void generateLore()}
          type="button"
        >
          Generate Lore
        </button>
      </div>
    );
  }

  if (loreLoading) {
    return (
      <div className="surface-card p-6">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="text-secondary text-sm">Generating lore...</p>
        </div>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
              <div className="h-3 w-full animate-pulse rounded bg-white/5" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loreError) {
    return (
      <div className="surface-card p-6">
        <p className="text-red-400 text-sm mb-3">{loreError}</p>
        <button
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20"
          onClick={() => void generateLore()}
          type="button"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!lore) return null;

  return (
    <div className="surface-card border-amber-800/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="typography-h2">Lore</h2>
        <button
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20"
          onClick={() => void generateLore()}
          type="button"
        >
          Regenerate
        </button>
      </div>
      <div className="space-y-5">
        {LORE_SECTIONS.map(({ key, label }) => {
          const text = lore[key];
          if (!text) return null;
          return (
            <div key={key}>
              <h3 className="text-xs font-medium uppercase tracking-wider text-amber-300/80 mb-1">
                {label}
              </h3>
              <div className="border-l-2 border-amber-800/30 pl-4 text-sm text-secondary leading-relaxed whitespace-pre-line">
                {text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
