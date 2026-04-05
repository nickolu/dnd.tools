import type { GeneratedFaction } from "../types";

type FactionCardProps = {
  faction: GeneratedFaction;
};

export function FactionCard({ faction }: FactionCardProps) {
  return (
    <div className="surface-card p-4">
      <h3 className="typography-h3">{faction.name}</h3>
      <div className="mt-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Resources
        </p>
        <ul className="mt-1 space-y-0.5 text-sm text-secondary">
          {faction.resources.map((r, i) => (
            <li key={i}>- {r}</li>
          ))}
        </ul>
      </div>
      <div className="mt-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Goals
        </p>
        <div className="mt-1 space-y-1">
          {faction.goals.map((goal, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="flex gap-0.5">
                {Array.from({ length: goal.difficulty }).map((_, j) => (
                  <span
                    key={j}
                    className="inline-block h-2 w-2 rounded-full border border-white/30"
                  />
                ))}
              </span>
              <span className="text-secondary">{goal.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
