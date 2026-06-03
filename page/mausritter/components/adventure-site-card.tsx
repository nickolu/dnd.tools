import type { GeneratedAdventureSite } from "../types";
import { ReRollButton } from "./re-roll-button";
import { RoomRow } from "./room-row";

type AdventureSiteCardProps = {
  site: GeneratedAdventureSite;
  hexId: string;
  onReroll: () => void;
  onRerollRoom: (roomId: string) => void;
  onAddRoom: () => void;
  onRemove: () => void;
};

export function AdventureSiteCard({
  site,
  onReroll,
  onRerollRoom,
  onAddRoom,
  onRemove,
}: AdventureSiteCardProps) {
  return (
    <div className="mt-3 rounded-lg border border-purple-800/20 bg-purple-900/10 p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-purple-200">
          Adventure Site
        </h4>
        <div className="flex items-center gap-1">
          <ReRollButton onClick={onReroll} label="Re-roll adventure site" />
          <button
            className="no-print text-xs text-muted opacity-60 hover:opacity-100 hover:text-red-400 transition-opacity px-1"
            onClick={onRemove}
            title="Remove adventure site"
            type="button"
          >
            &times;
          </button>
        </div>
      </div>

      <div className="mt-2 space-y-1 text-sm">
        <div>
          <span className="text-muted">Construction:</span>{" "}
          <span className="text-secondary">{site.construction}</span>
        </div>
        <div>
          <span className="text-muted">Inhabitants:</span>{" "}
          <span className="text-secondary">{site.inhabitants}</span>
        </div>
        <div>
          <span className="text-muted">Ruination:</span>{" "}
          <span className="text-secondary">{site.ruination}</span>
        </div>
        <div>
          <span className="text-muted">Searching for:</span>{" "}
          <span className="text-secondary">{site.searchingFor}</span>
        </div>
        <div>
          <span className="text-muted">Secret:</span>{" "}
          <span className="text-secondary">{site.secret}</span>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted mb-1">
          Rooms
        </p>
        <div className="space-y-1">
          {site.rooms.map((room) => (
            <RoomRow
              key={room.id}
              room={room}
              onReroll={() => onRerollRoom(room.id)}
            />
          ))}
        </div>
        <button
          className="no-print mt-1 text-xs text-muted opacity-60 hover:opacity-100 transition-opacity"
          onClick={onAddRoom}
          type="button"
        >
          + Add Room
        </button>
      </div>
    </div>
  );
}
