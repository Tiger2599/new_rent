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

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfMonthKey(monthKey = currentMonthKey()): string {
  return `${monthKey}-01`;
}

export function endOfMonthKey(monthKey = currentMonthKey()): string {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${monthKey}-${String(lastDay).padStart(2, "0")}`;
}

export function isInDateRange(
  date: string,
  from: string,
  to: string,
): boolean {
  const day = date.slice(0, 10);
  return day >= from && day <= to;
}

export function isBeforeDate(date: string, from: string): boolean {
  return date.slice(0, 10) < from;
}

export function formatDateRangeLabel(from: string, to: string): string {
  const parseLocal = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  if (from === to) {
    return parseLocal(from).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const fromDate = parseLocal(from);
  const toDate = parseLocal(to);
  const sameMonth =
    fromDate.getFullYear() === toDate.getFullYear() &&
    fromDate.getMonth() === toDate.getMonth();

  if (sameMonth) {
    return `${fromDate.toLocaleDateString("en-IN", { day: "numeric" })} – ${toDate.toLocaleDateString(
      "en-IN",
      { day: "numeric", month: "short", year: "numeric" },
    )}`;
  }

  const fromLabel = fromDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  const toLabel = toDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${fromLabel} – ${toLabel}`;
}
