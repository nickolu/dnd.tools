import { useHexCrawlStore } from "../hooks/useHexCrawlStore";
import { FactionCard } from "./faction-card";
import { HexCard } from "./hex-card";
import { HexMap } from "./hex-map";
import { HexOverview } from "./hex-overview";
import { ReRollButton } from "./re-roll-button";

export function HexCrawlDisplay() {
  const { hexes, factions, generate, clear, rerollFactions } = useHexCrawlStore();

  const settlementCount = hexes.filter((h) => h.settlement).length;
  const siteCount = hexes.filter((h) => h.adventureSite).length;

  return (
    <div className="space-y-6">
      <div className="surface-card flex items-center justify-between p-4">
        <div>
          <h1 className="typography-h1">Hex Crawl</h1>
          <p className="text-sm text-secondary">
            {hexes.length} hexes &middot; {settlementCount} settlements &middot;{" "}
            {siteCount} adventure sites &middot; {factions.length} factions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20"
            onClick={generate}
            type="button"
          >
            Regenerate All
          </button>
          <button
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-white/5"
            onClick={clear}
            type="button"
          >
            Start Over
          </button>
        </div>
      </div>

      {/* Map */}
      <HexMap hexes={hexes} />

      {/* Overview */}
      <HexOverview hexes={hexes} />

      {/* Factions */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="typography-h2">Factions</h2>
          <ReRollButton onClick={rerollFactions} label="Re-roll factions" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {factions.map((faction) => (
            <FactionCard key={faction.id} faction={faction} />
          ))}
        </div>
      </section>

      {/* Hexes */}
      <section>
        <h2 className="typography-h2 mb-3">Hexes</h2>
        <div className="space-y-4">
          {hexes.map((hex) => (
            <HexCard key={hex.id} hex={hex} />
          ))}
        </div>
      </section>
    </div>
  );
}
