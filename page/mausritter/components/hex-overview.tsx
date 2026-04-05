import type { GeneratedHex } from "../types";
import { HEX_TYPE_COLORS } from "../constants";

type HexOverviewProps = {
  hexes: GeneratedHex[];
};

export function HexOverview({ hexes }: HexOverviewProps) {
  return (
    <section>
      <h2 className="typography-h2 mb-3">Overview</h2>
      <div className="surface-card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-3 py-2 w-12">#</th>
              <th className="px-3 py-2 w-28">Type</th>
              <th className="px-3 py-2">Landmark</th>
              <th className="px-3 py-2 w-36">Features</th>
            </tr>
          </thead>
          <tbody>
            {hexes.map((hex) => {
              const typeColor =
                HEX_TYPE_COLORS[hex.hexType] ?? HEX_TYPE_COLORS.Countryside;
              return (
                <tr
                  key={hex.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/[0.03] cursor-pointer"
                  onClick={() => {
                    document
                      .getElementById(`hex-${hex.id}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <td className="px-3 py-1.5 font-mono text-muted">
                    {String(hex.index).padStart(2, "0")}
                  </td>
                  <td className="px-3 py-1.5">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${typeColor}`}
                    >
                      {hex.hexType}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">{hex.landmark}</td>
                  <td className="px-3 py-1.5">
                    <div className="flex gap-1.5">
                      {hex.settlement && (
                        <span className="rounded bg-amber-900/30 px-1.5 py-0.5 text-xs text-amber-300">
                          {hex.settlement.name}
                        </span>
                      )}
                      {hex.adventureSite && (
                        <span className="rounded bg-purple-900/30 px-1.5 py-0.5 text-xs text-purple-300">
                          Site
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
