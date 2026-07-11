export function toMonthKeyFromDate(date: string): string {
  return date.slice(0, 7);
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function currentMonthKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function previousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function buildMonthOptions(
  dates: string[],
  now = new Date(),
): string[] {
  const keys = new Set<string>([currentMonthKey(now)]);
  for (const date of dates) {
    if (date) keys.add(toMonthKeyFromDate(date));
  }

  return Array.from(keys).sort((a, b) => b.localeCompare(a));
}

export function isInMonth(date: string, monthKey: string): boolean {
  return toMonthKeyFromDate(date) === monthKey;
}

export function isBeforeMonth(date: string, monthKey: string): boolean {
  return toMonthKeyFromDate(date) < monthKey;
}
