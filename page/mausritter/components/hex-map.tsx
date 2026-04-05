import { useMemo } from "react";

import type { GeneratedHex } from "../types";

type HexMapProps = {
  hexes: GeneratedHex[];
};

const HEX_SIZE = 48;
const SQRT3 = Math.sqrt(3);
const HEX_WIDTH = SQRT3 * HEX_SIZE;
const PADDING = 16;

const BIOME_FILL: Record<string, string> = {
  Countryside: "#2d4a22",
  Forest: "#1a3a2a",
  River: "#1a3050",
  "Human town": "#4a3a1a",
};

const BIOME_STROKE: Record<string, string> = {
  Countryside: "#4a7a3a",
  Forest: "#2a6a4a",
  River: "#2a5a7a",
  "Human town": "#7a6a3a",
};

function pointyHexCorners(cx: number, cy: number, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    points.push(
      `${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`
    );
  }
  return points.join(" ");
}

// Axial directions for pointy-top hexes, clockwise from E
const DIRECTIONS: [number, number][] = [
  [1, 0], // E
  [0, 1], // SE
  [-1, 1], // SW
  [-1, 0], // W
  [0, -1], // NW
  [1, -1], // NE
];

function computeSpiralLayout(count: number): { q: number; r: number }[] {
  if (count === 0) return [];

  // Hex 1 at center
  const positions: { q: number; r: number }[] = [{ q: 0, r: 0 }];

  let ring = 1;
  while (positions.length < count) {
    // Start each ring at (0, -ring) = ring steps NW from center
    let q = DIRECTIONS[4]![0] * ring;
    let r = DIRECTIONS[4]![1] * ring;

    // Walk 6 sides clockwise, ring steps per side
    for (let side = 0; side < 6 && positions.length < count; side++) {
      for (let step = 0; step < ring && positions.length < count; step++) {
        positions.push({ q, r });
        q += DIRECTIONS[side]![0];
        r += DIRECTIONS[side]![1];
      }
    }

    ring++;
  }

  return positions;
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + "\u2026" : text;
}

export function HexMap({ hexes }: HexMapProps) {
  const layout = useMemo(() => {
    const positions = computeSpiralLayout(hexes.length);

    // Convert cube coords to pixel (pointy-top)
    const rawPositions = hexes.map((hex, i) => {
      const pos = positions[i]!;
      const px = HEX_SIZE * (SQRT3 * pos.q + (SQRT3 / 2) * pos.r);
      const py = HEX_SIZE * (1.5 * pos.r);
      return { hex, px, py };
    });

    // Normalize so all coords are positive with padding
    const minX = Math.min(...rawPositions.map((p) => p.px));
    const minY = Math.min(...rawPositions.map((p) => p.py));

    const hexPositions = rawPositions.map(({ hex, px, py }) => ({
      hex,
      cx: px - minX + HEX_WIDTH / 2 + PADDING,
      cy: py - minY + HEX_SIZE + PADDING,
    }));

    const maxX =
      Math.max(...hexPositions.map((p) => p.cx)) + HEX_WIDTH / 2 + PADDING;
    const maxY =
      Math.max(...hexPositions.map((p) => p.cy)) + HEX_SIZE + PADDING;

    return { hexPositions, width: maxX, height: maxY };
  }, [hexes]);

  return (
    <section>
      <h2 className="typography-h2 mb-3">Map</h2>
      <div className="surface-card overflow-x-auto p-4">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width={layout.width}
          height={layout.height}
          className="mx-auto"
          style={{ maxWidth: "100%" }}
        >
          {layout.hexPositions.map(({ hex, cx, cy }) => {
            const fill = BIOME_FILL[hex.hexType] ?? BIOME_FILL.Countryside;
            const stroke =
              BIOME_STROKE[hex.hexType] ?? BIOME_STROKE.Countryside;
            const hasSettlement = !!hex.settlement;
            const hasSite = !!hex.adventureSite;

            return (
              <g
                key={hex.id}
                className="cursor-pointer"
                onClick={() => {
                  document
                    .getElementById(`hex-${hex.id}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <polygon
                  points={pointyHexCorners(cx, cy, HEX_SIZE)}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={1.5}
                  className="transition-opacity hover:opacity-80"
                />
                {/* Hex number */}
                <text
                  x={cx}
                  y={cy - 14}
                  textAnchor="middle"
                  className="fill-white/70 font-mono font-bold"
                  style={{ fontSize: "10px" }}
                >
                  {String(hex.index).padStart(2, "0")}
                </text>
                {/* Landmark name */}
                <text
                  x={cx}
                  y={cy + 2}
                  textAnchor="middle"
                  className="fill-white/90"
                  style={{ fontSize: "8px" }}
                >
                  {truncate(hex.landmark, 14)}
                </text>
                {/* Feature indicators */}
                {hasSettlement && (
                  <text
                    x={cx - (hasSite ? 6 : 0)}
                    y={cy + 16}
                    textAnchor="middle"
                    className="fill-amber-400"
                    style={{ fontSize: "9px" }}
                  >
                    &#x2302;
                  </text>
                )}
                {hasSite && (
                  <text
                    x={cx + (hasSettlement ? 6 : 0)}
                    y={cy + 16}
                    textAnchor="middle"
                    className="fill-purple-400"
                    style={{ fontSize: "9px" }}
                  >
                    &#x2694;
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
