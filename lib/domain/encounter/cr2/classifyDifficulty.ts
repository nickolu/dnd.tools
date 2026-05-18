import {
  DIFFICULTY_BUCKETS_ADVANCED,
  DIFFICULTY_MULTIPLIERS_ADVANCED,
} from "./constants";
import type { DifficultyClassification } from "./types";

/**
 * Maps a party/encounter Power pair to a difficulty bucket per CR 2.0.
 *
 * Threshold = partyPower × multiplier(bucket). The bucket is the highest
 * one whose threshold is `<= encounterPower`. When encounterPower lies
 * strictly between bucket N's threshold and bucket N+1's threshold, the
 * result reports `between: [N, N+1]` so the UI can render "leaning N+1".
 */
export function classifyDifficulty(
  partyPower: number,
  encounterPower: number
): DifficultyClassification {
  const buckets = DIFFICULTY_BUCKETS_ADVANCED;
  const multipliers = DIFFICULTY_MULTIPLIERS_ADVANCED;

  const lowestBucket = buckets[0]!;
  const lowestThreshold = thresholdFor(partyPower, multipliers[lowestBucket]);
  if (encounterPower < lowestThreshold) {
    return { bucket: lowestBucket, between: null };
  }

  for (let i = buckets.length - 1; i >= 0; i--) {
    const bucket = buckets[i]!;
    const threshold = thresholdFor(partyPower, multipliers[bucket]);
    if (encounterPower >= threshold) {
      if (i < buckets.length - 1) {
        const nextBucket = buckets[i + 1]!;
        const nextThreshold = thresholdFor(partyPower, multipliers[nextBucket]);
        if (encounterPower > threshold && encounterPower < nextThreshold) {
          return { bucket, between: [bucket, nextBucket] };
        }
      }
      return { bucket, between: null };
    }
  }

  return { bucket: lowestBucket, between: null };
}

// Round to 2-decimal precision to avoid floating-point comparison drift
// (e.g. 100 * 1.1 evaluates to 110.00000000000001 in JS).
function thresholdFor(partyPower: number, multiplier: number): number {
  return Math.round(partyPower * multiplier * 100) / 100;
}
