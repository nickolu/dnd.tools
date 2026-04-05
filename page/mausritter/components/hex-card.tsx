import type { GeneratedHex } from "../types";
import { HEX_TYPE_COLORS } from "../constants";
import { ReRollButton } from "./re-roll-button";
import { SettlementCard } from "./settlement-card";
import { AdventureSiteCard } from "./adventure-site-card";
import { useHexCrawlStore } from "../hooks/useHexCrawlStore";

type HexCardProps = {
  hex: GeneratedHex;
};

export function HexCard({ hex }: HexCardProps) {
  const store = useHexCrawlStore();
  const typeColor = HEX_TYPE_COLORS[hex.hexType] ?? HEX_TYPE_COLORS.Countryside;

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
      </div>

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
        <div className="mt-2 flex gap-2">
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
          className="mt-2 text-xs text-muted opacity-60 hover:opacity-100 transition-opacity"
          onClick={() => store.addAdventureSite(hex.id)}
          type="button"
        >
          + Add Adventure Site
        </button>
      )}
      {!hex.settlement && hex.adventureSite && (
        <button
          className="mt-2 text-xs text-muted opacity-60 hover:opacity-100 transition-opacity"
          onClick={() => store.addSettlement(hex.id)}
          type="button"
        >
          + Add Settlement
        </button>
      )}
    </div>
  );
}
