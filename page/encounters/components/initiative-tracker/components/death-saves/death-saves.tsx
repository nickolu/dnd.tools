"use client";

type Props = {
  successes: number;
  failures: number;
  onSetSuccess: (count: number) => void;
  onSetFailure: (count: number) => void;
};

export function DeathSaves({
  successes,
  failures,
  onSetSuccess,
  onSetFailure,
}: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <span className="typography-kicker text-muted">Saves</span>
        {[1, 2, 3].map((i) => (
          <button
            key={`s${i}`}
            type="button"
            onClick={() => onSetSuccess(successes >= i ? i - 1 : i)}
            style={{
              width: "0.75rem",
              height: "0.75rem",
              borderRadius: "50%",
              border: "1.5px solid",
              borderColor: "var(--color-success, green)",
              background:
                i <= successes ? "var(--color-success, green)" : "transparent",
              cursor: "pointer",
              padding: 0,
            }}
            aria-label={`Death save success ${i}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="typography-kicker text-muted">Fails</span>
        {[1, 2, 3].map((i) => (
          <button
            key={`f${i}`}
            type="button"
            onClick={() => onSetFailure(failures >= i ? i - 1 : i)}
            style={{
              width: "0.75rem",
              height: "0.75rem",
              borderRadius: "50%",
              border: "1.5px solid",
              borderColor: "var(--color-error, red)",
              background:
                i <= failures ? "var(--color-error, red)" : "transparent",
              cursor: "pointer",
              padding: 0,
            }}
            aria-label={`Death save failure ${i}`}
          />
        ))}
      </div>
      {successes >= 3 && (
        <span
          className="typography-kicker"
          style={{ color: "var(--color-success, green)" }}
        >
          Stable
        </span>
      )}
      {failures >= 3 && (
        <span
          className="typography-kicker"
          style={{ color: "var(--color-error, red)" }}
        >
          Dead
        </span>
      )}
    </div>
  );
}
