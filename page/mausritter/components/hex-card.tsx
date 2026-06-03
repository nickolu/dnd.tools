import { HEX_TYPE_COLORS } from "../constants";
import { useHexCrawlStore } from "../hooks/useHexCrawlStore";
import type { GeneratedHex } from "../types";
import { AdventureSiteCard } from "./adventure-site-card";
import { ReRollButton } from "./re-roll-button";
import { SettlementCard } from "./settlement-card";

type HexCardProps = {
  hex: GeneratedHex;
};

export function HexCard({ hex }: HexCardProps) {
  const store = useHexCrawlStore();
  const typeColor = HEX_TYPE_COLORS[hex.hexType] ?? HEX_TYPE_COLORS.Countryside;
  const isLoadingLore = Boolean(store.hexLoreLoadingIds[hex.id]);
  const loreError = store.hexLoreErrors[hex.id];

  return (
    <div id={`hex-${hex.id}`} className="surface-card scroll-mt-4 p-4">
      <div className="flex items-start gap-3">
        <span className="text-lg font-mono font-bold text-muted">
          {String(hex.index).padStart(2, "0")}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${typeColor}`}
            >
              {hex.hexType}
            </span>
            <ReRollButton
              onClick={() => store.rerollHex(hex.id)}
              label="Re-roll hex type"
            />
          </div>
          <div className="mt-1 flex items-center gap-1">
            <p className="font-medium">{hex.landmark}</p>
            <ReRollButton
              onClick={() => store.rerollHexLandmark(hex.id)}
              label="Re-roll landmark"
            />
          </div>
          <div className="flex items-center gap-1">
            <p className="text-sm text-secondary italic">
              {hex.landmarkDetail}
            </p>
            <ReRollButton
              onClick={() => store.rerollHexLandmarkDetail(hex.id)}
              label="Re-roll detail"
            />
          </div>
        </div>

        <button
          className="no-print shrink-0 rounded-lg bg-amber-700/60 px-3 py-1.5 text-xs font-medium text-amber-100 transition-colors hover:bg-amber-700 disabled:opacity-40"
          disabled={isLoadingLore}
          onClick={() => void store.generateHexLore(hex.id)}
          title={
            hex.narrative
              ? "Regenerate location lore"
              : "Generate location lore"
          }
          type="button"
        >
          {isLoadingLore
            ? "Generating..."
            : hex.narrative
              ? "Regen Lore"
              : "Generate Lore"}
        </button>
      </div>

      {isLoadingLore && !hex.narrative && (
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-white/5" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-white/5" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-white/5" />
        </div>
      )}

      {loreError && <p className="mt-2 text-xs text-red-400">{loreError}</p>}

      {hex.narrative && (
        <div className="mt-3 border-l-2 border-amber-800/30 pl-4 text-sm text-secondary leading-relaxed whitespace-pre-line italic">
          {hex.narrative}
        </div>
      )}

      {hex.settlement && (
        <SettlementCard
          settlement={hex.settlement}
          hexId={hex.id}
          onReroll={() => store.rerollSettlement(hex.id)}
          onRerollEvent={() => store.rerollSettlementEvent(hex.id)}
          onRerollNpc={(npcId) => store.rerollNpc(hex.id, npcId)}
          onAddNpc={() => store.addNpc(hex.id)}
          onRemove={() => store.removeSettlement(hex.id)}
        />
      )}

      {hex.adventureSite && (
        <AdventureSiteCard
          site={hex.adventureSite}
          hexId={hex.id}
          onReroll={() => store.rerollAdventureSite(hex.id)}
          onRerollRoom={(roomId) => store.rerollRoom(hex.id, roomId)}
          onAddRoom={() => store.addRoom(hex.id)}
          onRemove={() => store.removeAdventureSite(hex.id)}
        />
      )}

      {!hex.settlement && !hex.adventureSite && (
        <div className="no-print mt-2 flex gap-2">
          <button
            className="text-xs text-muted opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => store.addSettlement(hex.id)}
            type="button"
          >
            + Add Settlement
          </button>
          <button
            className="text-xs text-muted opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => store.addAdventureSite(hex.id)}
            type="button"
          >
            + Add Adventure Site
          </button>
        </div>
      )}
      {hex.settlement && !hex.adventureSite && (
        <button
          className="no-print mt-2 text-xs text-muted opacity-60 hover:opacity-100 transition-opacity"
          onClick={() => store.addAdventureSite(hex.id)}
          type="button"
        >
          + Add Adventure Site
        </button>
      )}
      {!hex.settlement && hex.adventureSite && (
        <button
          className="no-print mt-2 text-xs text-muted opacity-60 hover:opacity-100 transition-opacity"
          onClick={() => store.addSettlement(hex.id)}
          type="button"
        >
          + Add Settlement
        </button>
      )}
    </div>
  );
}
