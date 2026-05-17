export function formatPower(value: number): string {
  return value.toLocaleString();
}

export function formatCr(crNumeric: number): string {
  if (crNumeric === 0.125) return "1/8";
  if (crNumeric === 0.25) return "1/4";
  if (crNumeric === 0.5) return "1/2";
  return String(crNumeric);
}
