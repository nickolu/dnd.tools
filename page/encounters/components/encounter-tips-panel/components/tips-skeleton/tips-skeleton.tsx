"use client";

export function TipsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {["Terrain", "Hazards", "Mechanics", "Tactical Notes"].map((label) => (
        <div key={label} className="flex flex-col gap-1">
          <span className="typography-kicker text-muted">{label}</span>
          <div
            className="h-4 rounded-md"
            style={{ background: "var(--color-border-subtle)" }}
          />
          <div
            className="h-4 w-3/4 rounded-md"
            style={{ background: "var(--color-border-subtle)" }}
          />
        </div>
      ))}
    </div>
  );
}
