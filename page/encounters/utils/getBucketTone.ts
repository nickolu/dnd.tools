import type { DifficultyBucket } from "@/lib/domain/encounter/cr2/types";

/**
 * Maps a difficulty bucket to a semantic color CSS variable. Higher buckets
 * use the accent (gold) to draw the eye; lower buckets stay in the muted
 * secondary tone.
 */
export function getBucketTone(bucket: DifficultyBucket): string {
  switch (bucket) {
    case "Mild":
    case "Bruising":
      return "var(--color-text-muted)";
    case "Bloody":
    case "Brutal":
      return "var(--color-text-secondary)";
    case "Oppressive":
    case "Overwhelming":
    case "Crushing":
    case "Devastating":
    case "Impossible":
      return "var(--color-accent)";
  }
}
