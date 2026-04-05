import { CONFIG_LABELS, CONFIG_LIMITS } from "../constants";
import { useHexCrawlStore } from "../hooks/useHexCrawlStore";
import type { HexCrawlConfig } from "../types";

export function ConfigPanel() {
  const { config, setConfig, generate } = useHexCrawlStore();

  const configKeys: (keyof HexCrawlConfig)[] = [
    "hexCount",
    "factionCount",
    "adventureSiteCount",
    "npcsPerSettlement",
    "roomsPerSite",
  ];

  return (
    <div className="surface-card mx-auto max-w-lg p-6">
      <h1 className="typography-h1 text-center">Mausritter Hex Crawl</h1>
      <p className="mt-2 text-center text-sm text-secondary">
        Generate a random hex crawl for your Mausritter campaign.
      </p>

      <div className="mt-6 space-y-4">
        {configKeys.map((key) => {
          const limits = CONFIG_LIMITS[key];
          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium" htmlFor={key}>
                {CONFIG_LABELS[key]}
              </label>
              <input
                className="input-field w-20 px-2 py-1 text-center"
                id={key}
                max={limits.max}
                min={limits.min}
                onChange={(e) =>
                  setConfig({
                    [key]: Math.max(
                      limits.min,
                      Math.min(limits.max, Number(e.target.value) || limits.min)
                    ),
                  })
                }
                type="number"
                value={config[key]}
              />
            </div>
          );
        })}
      </div>

      <button
        className="mt-6 w-full rounded-lg bg-white/10 px-4 py-3 font-medium transition-colors hover:bg-white/20"
        onClick={generate}
        type="button"
      >
        Generate Hex Crawl
      </button>
    </div>
  );
}
