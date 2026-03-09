import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Tenant, Property, RentPayment, Expense } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId, canAccess } from '@/lib/permissions';
import { startOfMonth, endOfMonth } from 'date-fns';

/**
 * GET /api/balance-sheet?month=1&year=2024
 * Returns total rent income, total deposit received, total expenses, final balance for that month.
 */
export async function GET(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'balanceSheet')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1), 10);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    const propertyIds = await Property.find({ userId: ownerId, isDeleted: false }).distinct('_id');
    const tenantIds = await Tenant.find({ propertyId: { $in: propertyIds } }).distinct('_id');

    const [rentIncome, expenses] = await Promise.all([
      RentPayment.aggregate([
        { $match: { tenantId: { $in: tenantIds }, paymentDate: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { userId: ownerId, date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalRentIncome = rentIncome[0]?.total ?? 0;
    const totalExpenses = expenses[0]?.total ?? 0;
    // Deposit received: tenants who joined this month with no pending = (depositAmount - depositPending) counted as received
    const depositAgg = await Tenant.aggregate([
      { $match: { propertyId: { $in: propertyIds }, joinDate: { $gte: start, $lte: end } } },
      { $project: { received: { $subtract: ['$depositAmount', '$depositPending'] } } },
      { $group: { _id: null, total: { $sum: '$received' } } },
    ]);
    const totalDepositReceived = Math.max(0, depositAgg[0]?.total ?? 0);
    const finalBalance = totalRentIncome + totalDepositReceived - totalExpenses;

    return NextResponse.json({
      month,
      year,
      totalRentIncome,
      totalDepositReceived,
      totalExpenses,
      finalBalance,
    });
  } catch (e) {
    console.error('Balance sheet error:', e);
    return NextResponse.json({ error: 'Failed to load balance sheet' }, { status: 500 });
  }
}
