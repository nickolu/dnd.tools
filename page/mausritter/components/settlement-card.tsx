import type { GeneratedSettlement } from "../types";
import { NpcCard } from "./npc-card";
import { ReRollButton } from "./re-roll-button";

type SettlementCardProps = {
  settlement: GeneratedSettlement;
  hexId: string;
  onReroll: () => void;
  onRerollEvent: () => void;
  onRerollNpc: (npcId: string) => void;
  onAddNpc: () => void;
  onRemove: () => void;
};

export function SettlementCard({
  settlement,
  onReroll,
  onRerollEvent,
  onRerollNpc,
  onAddNpc,
  onRemove,
}: SettlementCardProps) {
  return (
    <div className="mt-3 rounded-lg border border-amber-800/20 bg-amber-900/10 p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-amber-200">
          {settlement.name}
        </h4>
        <div className="flex items-center gap-1">
          <ReRollButton onClick={onReroll} label="Re-roll settlement" />
          <button
            className="text-xs text-muted opacity-60 hover:opacity-100 hover:text-red-400 transition-opacity px-1"
            onClick={onRemove}
            title="Remove settlement"
            type="button"
          >
            &times;
          </button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div>
          <span className="text-muted">Size:</span>{" "}
          <span className="text-secondary">{settlement.size}</span>
        </div>
        <div>
          <span className="text-muted">Governance:</span>{" "}
          <span className="text-secondary">{settlement.governance}</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted">Detail:</span>{" "}
          <span className="text-secondary italic">{settlement.detail}</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted">Industry:</span>{" "}
          <span className="text-secondary">
            {settlement.industries.join("; ")}
          </span>
        </div>
        <div className="col-span-2 flex items-center gap-1">
          <span className="text-muted">Event:</span>{" "}
          <span className="text-secondary">{settlement.event}</span>
          <ReRollButton onClick={onRerollEvent} label="Re-roll event" />
        </div>
      </div>

      {settlement.tavern && (
        <div className="mt-2 rounded border border-white/5 bg-white/[0.02] px-2 py-1 text-sm">
          <span className="text-muted">Tavern:</span>{" "}
          <span className="font-medium">{settlement.tavern.name}</span>
          <span className="text-muted"> — Specialty: </span>
          <span className="text-secondary">
            {settlement.tavern.specialtyMeal}
          </span>
        </div>
      )}

      {settlement.npcs.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted mb-1">
            NPCs
          </p>
          <div className="space-y-1">
            {settlement.npcs.map((npc) => (
              <NpcCard
                key={npc.id}
                npc={npc}
                onReroll={() => onRerollNpc(npc.id)}
              />
            ))}
          </div>
          <button
            className="mt-1 text-xs text-muted opacity-60 hover:opacity-100 transition-opacity"
            onClick={onAddNpc}
            type="button"
          >
            + Add NPC
          </button>
        </div>
      )}
    </div>
  );
}
