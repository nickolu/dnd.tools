import { rollDie } from "@/lib/util/dice";

/** Rolls 1d20 + the supplied modifier. */
export function rollInitiative(modifier: number): number {
  return rollDie(20) + modifier;
}
