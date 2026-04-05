import type { GeneratedTreasure } from "../types";

type TreasureDisplayProps = {
  treasure: GeneratedTreasure;
};

export function TreasureDisplay({ treasure }: TreasureDisplayProps) {
  if (treasure.type === "No treasure") return null;

  return (
    <div className="mt-1 rounded border border-amber-800/30 bg-amber-900/20 px-2 py-1 text-sm">
      <span className="font-medium text-amber-300">Treasure:</span>{" "}
      {treasure.magicSword ? (
        <span>
          <span className="font-medium">{treasure.magicSword.name}</span>
          {" "}({treasure.magicSword.weaponClass})
          {treasure.magicSword.trigger && (
            <span className="text-muted"> — {treasure.magicSword.trigger}:</span>
          )}{" "}
          {treasure.magicSword.effect}
          {treasure.magicSword.isCursed && (
            <span className="ml-2 text-red-400">
              Cursed: {treasure.magicSword.curse}
              {treasure.magicSword.curseLiftedBy && (
                <span className="text-muted"> (Lifted by: {treasure.magicSword.curseLiftedBy})</span>
              )}
            </span>
          )}
        </span>
      ) : (
        <span>{treasure.detail}</span>
      )}
    </div>
  );
}
