export function getCopyFeedbackLabel(
  itemTypeLabel: string,
  count: number
): string {
  const noun = count === 1 ? itemTypeLabel : `${itemTypeLabel}s`;
  return `Copied ${count} ${noun}.`;
}
