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
        Reset initiative
      </button>
      <button
        type="button"
        className="admin-button-secondary typography-body-sm px-2 py-1"
        onClick={() => {
          if (
            window.confirm(
              "Reset encounter? This will restore all HP, clear conditions, and reset initiative."
            )
          ) {
            onEnd();
          }
        }}
        style={{ color: "var(--color-danger)" }}
      >
        Reset encounter
      </button>
    </div>
  );
}
