import type { GeneratedRoom } from "../types";
import { ROOM_TYPE_COLORS } from "../constants";
import { ReRollButton } from "./re-roll-button";
import { TreasureDisplay } from "./treasure-display";

type RoomRowProps = {
  room: GeneratedRoom;
  onReroll: () => void;
};

export function RoomRow({ room, onReroll }: RoomRowProps) {
  const typeColor = ROOM_TYPE_COLORS[room.roomType] ?? ROOM_TYPE_COLORS.Empty;

  return (
    <div className="rounded border border-white/5 bg-white/[0.02] px-3 py-2">
      <div className="flex items-start gap-2">
        <span className="text-muted text-xs font-mono mt-0.5">
          {room.roomNumber}.
        </span>
        <span
          className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${typeColor}`}
        >
          {room.roomType}
        </span>
        <div className="flex gap-2 text-xs">
          {room.hasCreature && (
            <span className="text-red-400" title="Creature present">
              creature
            </span>
          )}
          {room.hasTreasure && (
            <span className="text-amber-400" title="Treasure present">
              treasure
            </span>
          )}
        </div>
        <div className="ml-auto">
          <ReRollButton onClick={onReroll} label="Re-roll room" />
        </div>
      </div>
      {room.feature && (
        <p className="mt-1 text-sm text-secondary pl-5">{room.feature}</p>
      )}
      {room.treasure && room.treasure.type !== "No treasure" && (
        <div className="pl-5">
          <TreasureDisplay treasure={room.treasure} />
        </div>
      )}
    </div>
  );
}
