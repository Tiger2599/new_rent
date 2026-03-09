import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Property, Flat, Tenant, RentPayment, Expense, Note } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId } from '@/lib/permissions';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const propertyIds = await Property.find({ userId: ownerId, isDeleted: false }).distinct('_id');

    const [
      totalProperties,
      totalFlats,
      activeTenants,
      inactiveTenants,
      pinnedNotes,
      recentPayments,
      rentDueItems,
      depositPendingItems,
    ] = await Promise.all([
      Property.countDocuments({ userId: ownerId, isDeleted: false }),
      Flat.countDocuments({ userId: ownerId, isDeleted: false }),
      Tenant.countDocuments({ propertyId: { $in: propertyIds }, isActive: true, isDeleted: false }),
      Tenant.countDocuments({ propertyId: { $in: propertyIds }, isActive: false, isDeleted: false }),
      Note.find({ userId: ownerId, isPinned: true }).sort({ updatedAt: -1 }).limit(5).lean(),
      RentPayment.find({ tenantId: { $in: await Tenant.find({ propertyId: { $in: propertyIds } }).distinct('_id') } })
        .sort({ paymentDate: -1 })
        .limit(5)
        .populate('tenantId', 'name')
        .lean(),
      (async () => {
        const { rentDueForMonth } = await import('@/lib/rent-calc');
        const now = new Date();
        const thisMonth = startOfMonth(now);
        const tenants = await Tenant.find({
          propertyId: { $in: propertyIds },
          isActive: true,
          isDeleted: false,
        }).lean();
        const dueList: Array<{ tenant: unknown; dueAmount: number }> = [];
        for (const t of tenants) {
          const due = rentDueForMonth(
            (t as { rentAmount: number }).rentAmount,
            new Date((t as { joinDate: Date }).joinDate),
            (t as { leaveDate?: Date }).leaveDate ? new Date((t as { leaveDate: Date }).leaveDate) : null,
            thisMonth
          );
          const paid = await RentPayment.aggregate([
            { $match: { tenantId: (t as { _id: unknown })._id, month: now.getMonth() + 1, year: now.getFullYear() } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]);
          const paidSum = paid[0]?.total ?? 0;
          const dueAmount = Math.max(0, due - paidSum);
          if (dueAmount > 0) dueList.push({ tenant: t, dueAmount });
        }
        return dueList.slice(0, 10);
      })(),
      Tenant.find({
        propertyId: { $in: propertyIds },
        isActive: true,
        isDeleted: false,
        depositPending: { $gt: 0 },
      })
        .populate('propertyId', 'name')
        .populate('flatId', 'flatNumber')
        .limit(10)
        .lean(),
    ]);

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const tenantIds = await Tenant.find({ propertyId: { $in: propertyIds } }).distinct('_id');
    const [totalRentIncome, totalExpenses] = await Promise.all([
      RentPayment.aggregate([
        { $match: { tenantId: { $in: tenantIds }, paymentDate: { $gte: thisMonthStart, $lte: thisMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { userId: ownerId, date: { $gte: thisMonthStart, $lte: thisMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);
    const monthlyRentIncome = totalRentIncome[0]?.total ?? 0;
    const monthlyExpenses = totalExpenses[0]?.total ?? 0;
    const currentBalance = monthlyRentIncome - monthlyExpenses;

    return NextResponse.json({
      stats: {
        totalProperties,
        totalFlats,
        activeTenants,
        inactiveTenants,
        totalMonthlyRentIncome: monthlyRentIncome,
        totalExpenses: monthlyExpenses,
        currentBalance,
      },
      recentRentPayments: recentPayments,
      pendingRentList: rentDueItems,
      pendingDepositList: depositPendingItems,
      pinnedNotes,
    });
  } catch (e) {
    console.error('Dashboard error:', e);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
