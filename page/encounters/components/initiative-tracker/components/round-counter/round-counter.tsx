"use client";

type Props = {
  round: number;
  onPrev: () => void;
  onNext: () => void;
};

export function RoundCounter({ round, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="admin-button-secondary typography-body-sm px-2 py-1"
        onClick={onPrev}
        aria-label="Previous turn"
      >
        ◀ Prev
      </button>
      <div
        className="flex flex-col items-center"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="typography-kicker text-muted">Round</span>
        <span className="typography-h2">{round}</span>
      </div>
      <button
        type="button"
        className="admin-button typography-body-sm px-2 py-1"
        onClick={onNext}
        aria-label="Next turn"
      >
        Next ▶
      </button>
    </div>
  );
}
