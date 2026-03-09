/**
 * Rent calculation logic: full month, prorated join/leave, pending rent.
 */
import {
  getDaysInMonth,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isBefore,
  isAfter,
} from 'date-fns';

/** Get number of days in month for a given date */
export function daysInMonth(d: Date): number {
  return getDaysInMonth(d);
}

/**
 * Prorated rent when tenant joins mid-month.
 * joinDate is the first day of occupancy.
 * Returns rent for the remainder of that month.
 */
export function proratedRentForJoin(
  monthlyRent: number,
  joinDate: Date,
  month: Date
): number {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  if (isAfter(joinDate, monthEnd)) return 0;
  if (isBefore(joinDate, monthStart)) {
    // Joined before this month → full month
    return monthlyRent;
  }
  const daysInMo = daysInMonth(month);
  const dayRate = monthlyRent / daysInMo;
  const from = joinDate;
  const to = monthEnd;
  const days = differenceInDays(to, from) + 1;
  return Math.round(dayRate * days);
}

/**
 * Prorated rent when tenant leaves mid-month.
 * leaveDate is the last day of occupancy.
 */
export function proratedRentForLeave(
  monthlyRent: number,
  leaveDate: Date,
  month: Date
): number {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  if (isBefore(leaveDate, monthStart)) return 0;
  if (isAfter(leaveDate, monthEnd)) return monthlyRent;
  const daysInMo = daysInMonth(month);
  const dayRate = monthlyRent / daysInMo;
  const from = monthStart;
  const to = leaveDate;
  const days = differenceInDays(to, from) + 1;
  return Math.round(dayRate * days);
}

/**
 * Rent due for a given month for a tenant.
 * Rule: First rent is from the month AFTER join. (e.g. joined 1 Feb → first rent is March.)
 */
export function rentDueForMonth(
  monthlyRent: number,
  joinDate: Date,
  leaveDate: Date | null | undefined,
  month: Date
): number {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  if (leaveDate && isBefore(leaveDate, monthStart)) return 0;
  if (isAfter(joinDate, monthEnd)) return 0;

  // First rent is from next month after join (e.g. joined Feb → March rent)
  if (joinDate.getMonth() === month.getMonth() && joinDate.getFullYear() === month.getFullYear()) return 0;
  if (isBefore(monthStart, joinDate)) return 0;

  const joinInThisMonth = isWithinInterval(joinDate, { start: monthStart, end: monthEnd });
  const leaveInThisMonth = leaveDate && isWithinInterval(leaveDate, { start: monthStart, end: monthEnd });

  if (joinInThisMonth && leaveInThisMonth && leaveDate) {
    const daysInMo = daysInMonth(month);
    const dayRate = monthlyRent / daysInMo;
    const days = differenceInDays(leaveDate, joinDate) + 1;
    return Math.round(dayRate * days);
  }
  if (joinInThisMonth) return proratedRentForJoin(monthlyRent, joinDate, month);
  if (leaveInThisMonth && leaveDate) return proratedRentForLeave(monthlyRent, leaveDate, month);
  return monthlyRent;
}
