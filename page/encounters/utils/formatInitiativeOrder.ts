import type {
  Combatant,
  PartyMember,
} from "@/lib/domain/encounter/encounter.schema";

import type { InitiativeSlot } from "./initiativeOrder";

export function formatInitiativeOrder(
  slots: InitiativeSlot[],
  round: number,
  partyMembers: PartyMember[],
  combatants: Combatant[]
): string {
  const lines: string[] = [`Round ${round} Initiative:`];

  for (const slot of slots) {
    const init = slot.initiative !== null ? String(slot.initiative) : "—";

    if (slot.kind === "party") {
      const pc = partyMembers.find((p) => p.id === slot.id);
      const hpPart =
        pc?.maxHp !== undefined && pc?.currentHp !== undefined
          ? ` (HP: ${pc.currentHp}/${pc.maxHp})`
          : "";
      lines.push(`${init} — ${slot.name} (PC)${hpPart}`);
    } else if (slot.kind === "group") {
      const totalCurrent = slot.combatants.reduce((s, c) => s + c.currentHp, 0);
      const totalMax = slot.combatants.reduce((s, c) => s + c.maxHp, 0);
      lines.push(
        `${init} — ${slot.name} \xd7${slot.combatants.length} (HP: ${totalCurrent}/${totalMax})`
      );
    } else {
      // Single combatant
      const c = combatants.find((cb) => cb.id === slot.id);
      const hpPart = c ? ` (HP: ${c.currentHp}/${c.maxHp})` : "";
      const sidePart = slot.side === "ally" ? " [ally]" : "";
      lines.push(`${init} — ${slot.name}${sidePart}${hpPart}`);
    }
  }

  return lines.join("\n");
}
