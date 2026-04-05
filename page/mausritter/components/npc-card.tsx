import type { GeneratedNpc } from "../types";
import { ReRollButton } from "./re-roll-button";

type NpcCardProps = {
  npc: GeneratedNpc;
  onReroll: () => void;
};

export function NpcCard({ npc, onReroll }: NpcCardProps) {
  return (
    <div className="rounded border border-white/5 bg-white/[0.02] px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">{npc.name}</span>
        <ReRollButton onClick={onReroll} label="Re-roll NPC" />
      </div>
      <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
        <div>
          <span className="text-muted">Position:</span>{" "}
          <span className="text-secondary">{npc.socialPosition}</span>
        </div>
        <div>
          <span className="text-muted">Payment:</span>{" "}
          <span className="text-secondary">{npc.paymentForService}</span>
        </div>
        <div>
          <span className="text-muted">Birthsign:</span>{" "}
          <span className="text-secondary">{npc.birthsign}</span>
        </div>
        <div>
          <span className="text-muted">Disposition:</span>{" "}
          <span className="text-secondary">{npc.disposition}</span>
        </div>
        <div>
          <span className="text-muted">Appearance:</span>{" "}
          <span className="text-secondary">{npc.appearance}</span>
        </div>
        <div>
          <span className="text-muted">Quirk:</span>{" "}
          <span className="text-secondary">{npc.quirk}</span>
        </div>
        <div>
          <span className="text-muted">Wants:</span>{" "}
          <span className="text-secondary">{npc.wants}</span>
        </div>
        <div>
          <span className="text-muted">Relationship:</span>{" "}
          <span className="text-secondary">{npc.relationship}</span>
        </div>
      </div>
    </div>
  );
}
