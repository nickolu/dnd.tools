"use client";

import Link from "next/link";

import type { AggregatedSpell } from "@/page/encounters/utils/aggregateSpells";
import {
  formatSpellComponents,
  formatSpellLevelAndSchool,
} from "@/page/spells/components/spell-card/utils/formatSpell";

type Props = {
  spells: AggregatedSpell[];
};

function summarizeCasters(entry: AggregatedSpell): string {
  return entry.casters
    .map((c) =>
      c.instanceCount > 1
        ? `${c.monsterName} (×${c.instanceCount})`
        : c.monsterName
    )
    .join(", ");
}

export function SpellTableView({ spells }: Props) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.82rem",
          lineHeight: "1.45",
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "1px solid var(--color-border-strong)",
            }}
          >
            <th
              className="text-muted"
              style={{
                textAlign: "left",
                padding: "0.35rem 0.5rem",
                fontWeight: 600,
                fontSize: "0.7rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Name
            </th>
            <th
              className="text-muted"
              style={{
                textAlign: "left",
                padding: "0.35rem 0.5rem",
                fontWeight: 600,
                fontSize: "0.7rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Level / School
            </th>
            <th
              className="text-muted"
              style={{
                textAlign: "left",
                padding: "0.35rem 0.5rem",
                fontWeight: 600,
                fontSize: "0.7rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Cast Time
            </th>
            <th
              className="text-muted"
              style={{
                textAlign: "left",
                padding: "0.35rem 0.5rem",
                fontWeight: 600,
                fontSize: "0.7rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Range
            </th>
            <th
              className="text-muted"
              style={{
                textAlign: "left",
                padding: "0.35rem 0.5rem",
                fontWeight: 600,
                fontSize: "0.7rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Comp.
            </th>
            <th
              className="text-muted"
              style={{
                textAlign: "left",
                padding: "0.35rem 0.5rem",
                fontWeight: 600,
                fontSize: "0.7rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Cast by
            </th>
          </tr>
        </thead>
        <tbody>
          {spells.map((entry) => (
            <tr
              key={entry.spell.id}
              style={{
                borderBottom: "1px solid var(--color-border-subtle)",
              }}
            >
              <td style={{ padding: "0.35rem 0.5rem", whiteSpace: "nowrap" }}>
                <Link
                  href={`/spells/${entry.spell.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ textDecoration: "none" }}
                >
                  {entry.spell.name}
                </Link>
                {entry.spell.concentration ? (
                  <span
                    className="text-muted"
                    style={{ marginLeft: "0.35rem", fontSize: "0.7rem" }}
                  >
                    C
                  </span>
                ) : null}
                {entry.spell.ritual ? (
                  <span
                    className="text-muted"
                    style={{ marginLeft: "0.2rem", fontSize: "0.7rem" }}
                  >
                    R
                  </span>
                ) : null}
              </td>
              <td
                className="text-secondary"
                style={{ padding: "0.35rem 0.5rem", whiteSpace: "nowrap" }}
              >
                {formatSpellLevelAndSchool(entry.spell)}
              </td>
              <td
                className="text-muted"
                style={{ padding: "0.35rem 0.5rem", whiteSpace: "nowrap" }}
              >
                {entry.spell.castingTime}
              </td>
              <td
                className="text-muted"
                style={{ padding: "0.35rem 0.5rem", whiteSpace: "nowrap" }}
              >
                {entry.spell.range}
              </td>
              <td
                className="text-muted"
                style={{ padding: "0.35rem 0.5rem", whiteSpace: "nowrap" }}
              >
                {formatSpellComponents(entry.spell)}
              </td>
              <td className="text-muted" style={{ padding: "0.35rem 0.5rem" }}>
                {summarizeCasters(entry)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
