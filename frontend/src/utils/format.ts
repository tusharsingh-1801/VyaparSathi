export function formatINR(value: number | null): string {
  if (value === null) return "—";
  return "₹" + value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
