import type { BalanceResult } from "@/lib/domain/encounter/cr2/types";
import type { Encounter } from "@/lib/domain/encounter/encounter.schema";

export function buildEncounterSummary(
  encounter: Encounter,
  balance: BalanceResult
): string {
  const lines: string[] = [];

  lines.push(`# ${encounter.name}`);
  lines.push(`Round: ${encounter.initiative.round}`);
  lines.push(`Difficulty: ${balance.classification.bucket}`);
  lines.push("");

  // Party
  if (encounter.partyMembers.length > 0) {
    lines.push("## Party");
    for (const pc of encounter.partyMembers) {
      let pcLine = `- ${pc.name} (Level ${pc.level})`;
      if (pc.maxHp !== undefined && pc.currentHp !== undefined) {
        pcLine += ` — HP: ${pc.currentHp}/${pc.maxHp}`;
      }
      if (pc.conditions.length > 0) {
        pcLine += ` [${pc.conditions.join(", ")}]`;
      }
      lines.push(pcLine);
    }
    lines.push("");
  }

  // Enemies
  const enemies = encounter.combatants.filter((c) => c.side === "enemy");
  if (enemies.length > 0) {
    lines.push("## Enemies");
    for (const e of enemies) {
      const name = e.nameOverride ?? e.monsterName;
      const status = e.currentHp <= 0 ? " (DEAD)" : "";
      let line = `- ${name} — HP: ${e.currentHp}/${e.maxHp}${status}`;
      if (e.conditions.length > 0) {
        line += ` [${e.conditions.join(", ")}]`;
      }
      lines.push(line);
    }
    lines.push("");
  }

  // Allies
  const allies = encounter.combatants.filter((c) => c.side === "ally");
  if (allies.length > 0) {
    lines.push("## Allies");
    for (const a of allies) {
      const name = a.nameOverride ?? a.monsterName;
      let line = `- ${name} — HP: ${a.currentHp}/${a.maxHp}`;
      if (a.conditions.length > 0) {
        line += ` [${a.conditions.join(", ")}]`;
      }
      lines.push(line);
    }
    lines.push("");
  }

  // Notes
  if (encounter.notes) {
    lines.push("## Notes");
    lines.push(encounter.notes);
  }

  return lines.join("\n");
}
