export const DEFAULT_ELECTRICITY_RATE = 9;

export function lastElectricityUnits(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function normalizeElectricityRate(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_ELECTRICITY_RATE;
  return n;
}

export function electricityCharge(
  previousUnits: number,
  nextUnits: number,
  rate: number = DEFAULT_ELECTRICITY_RATE,
): number {
  return Math.max(0, nextUnits - previousUnits) * rate;
}

export function electricityUnitsConsumed(payment: {
  previousElectricityUnits?: number;
  electricityUnits?: number;
}): number {
  if (payment.electricityUnits == null) return 0;
  const previous = payment.previousElectricityUnits ?? 0;
  return Math.max(0, payment.electricityUnits - previous);
}

export function parseElectricityUnits(
  value: unknown,
  fallback = 0,
): { units: number; error?: string } {
  if (value === undefined || value === null || value === "") {
    return { units: fallback };
  }

  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return { units: fallback, error: "Electricity units must be a number 0 or more." };
  }

  return { units: n };
}
