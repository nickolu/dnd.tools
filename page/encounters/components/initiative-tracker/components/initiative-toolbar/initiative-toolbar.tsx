"use client";

type Props = {
  onRollAll: () => void;
  onRollEnemies: () => void;
  onRollAllies: () => void;
  onReset: () => void;
  onEnd: () => void;
};

export function InitiativeToolbar({
  onRollAll,
  onRollEnemies,
  onRollAllies,
  onReset,
  onEnd,
}: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        className="admin-button typography-body-sm px-2 py-1"
        onClick={onRollAll}
      >
        Roll all
      </button>
      <button
        type="button"
        className="admin-button-secondary typography-body-sm px-2 py-1"
        onClick={onRollEnemies}
      >
        Roll enemies
      </button>
      <button
        type="button"
        className="admin-button-secondary typography-body-sm px-2 py-1"
        onClick={onRollAllies}
      >
        Roll allies
      </button>
      <button
        type="button"
        className="admin-button-secondary typography-body-sm px-2 py-1"
        onClick={onReset}
      >
        Reset
      </button>
      <button
        type="button"
        className="admin-button-secondary typography-body-sm px-2 py-1"
        onClick={onEnd}
      >
        End encounter
      </button>
    </div>
  );
}
