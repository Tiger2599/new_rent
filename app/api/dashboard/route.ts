import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Property, Flat, Tenant, RentPayment, Expense, Note, OtherIncome } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId } from '@/lib/permissions';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function categorizeExpense(name: string): 'maintenance' | 'utilities' | 'other' {
  const n = (name || '').toLowerCase();
  if (n.includes('maintenance') || n.includes('repair')) return 'maintenance';
  if (n.includes('utility') || n.includes('electric') || n.includes('water') || n.includes('gas')) return 'utilities';
  return 'other';
}

export async function GET(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const ownerOid = new mongoose.Types.ObjectId(String(ownerId));
    const propertyIds = await Property.find({ userId: ownerId, isDeleted: false }).distinct('_id');
    const tenantIds = await Tenant.find({ propertyId: { $in: propertyIds } }).distinct('_id');

    const [
      totalProperties,
      totalFlats,
      activeTenants,
      inactiveTenants,
      pinnedNotes,
      recentPayments,
      rentDueItems,
      depositPendingItems,
      cashFlowMonths,
      expenseBreakdown,
      recentNotesForActivity,
    ] = await Promise.all([
      Property.countDocuments({ userId: ownerId, isDeleted: false }),
      Flat.countDocuments({ userId: ownerId, isDeleted: false }),
      Tenant.countDocuments({ propertyId: { $in: propertyIds }, isActive: true, isDeleted: false }),
      Tenant.countDocuments({ propertyId: { $in: propertyIds }, isActive: false, isDeleted: false }),
      Note.find({ userId: ownerId, isPinned: true }).sort({ updatedAt: -1 }).limit(10).lean(),
      RentPayment.find({ tenantId: { $in: tenantIds } })
        .sort({ paymentDate: -1 })
        .limit(10)
        .populate({ path: 'tenantId', select: 'name propertyId flatId', populate: [{ path: 'propertyId', select: 'name' }, { path: 'flatId', select: 'flatNumber' }] })
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
            (t as { leaveDate?: Date }).leaveDate
              ? new Date((t as { leaveDate: Date }).leaveDate)
              : null,
            thisMonth
          );
      
          const paid = await RentPayment.aggregate([
            {
              $match: {
                tenantId: (t as { _id: unknown })._id,
                month: now.getMonth() + 1,
                year: now.getFullYear(),
              },
            },
            {
              $group: { _id: null, total: { $sum: '$amount' } },
            },
          ]);
      
          const paidSum = paid[0]?.total ?? 0;
          const dueAmount = Math.max(0, due - paidSum);
      
          if (dueAmount > 0) {
            dueList.push({ tenant: t, dueAmount });
          }
        }
      
        // ✅ FULL CALCULATION
        const totalPendingRent = dueList.reduce((s, i) => s + i.dueAmount, 0);
      
        return {
          list: dueList.slice(0, 10), // UI ke liye
          total: totalPendingRent,    // FULL calculation
        };
      })(),
      (async () => {
        const tenants = await Tenant.find({
          propertyId: { $in: propertyIds },
          isActive: true,
          isDeleted: false,
          depositPending: { $gt: 0 },
        })
          .populate('propertyId', 'name')
          .populate('flatId', 'flatNumber')
          .lean();
      
        const totalPendingDeposit = tenants.reduce(
          (s, t) => s + (t.depositPending ?? 0),
          0
        );
      
        return {
          list: tenants.slice(0, 10),
          total: totalPendingDeposit,
        };
      })(),
      (async () => {
        const now = new Date();
        const result: Array<{ month: number; year: number; monthLabel: string; income: number; expenses: number }> = [];
        for (let i = 0; i < 6; i++) {
          const d = subMonths(now, i);
          const m = d.getMonth() + 1;
          const y = d.getFullYear();
          const start = startOfMonth(d);
          const end = endOfMonth(d);
          const [incomeRes, otherIncRes, expRes] = await Promise.all([
            RentPayment.aggregate([
              { $match: { tenantId: { $in: tenantIds }, paymentDate: { $gte: start, $lte: end } } },
              { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            OtherIncome.aggregate([
              { $match: { userId: ownerOid, isDeleted: false, date: { $gte: start, $lte: end } } },
              { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Expense.aggregate([
              { $match: { userId: ownerId, date: { $gte: start, $lte: end } } },
              { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
          ]);
          const rentTotal = incomeRes[0]?.total ?? 0;
          const otherTotal = otherIncRes[0]?.total ?? 0;
          result.push({
            month: m,
            year: y,
            monthLabel: MONTHS[m - 1] + ' ' + String(y).slice(2),
            income: rentTotal + otherTotal,
            expenses: expRes[0]?.total ?? 0,
          });
        }
        return result.reverse();
      })(),
      (async () => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        const expenses = await Expense.find({ userId: ownerId, date: { $gte: start, $lte: end } }).lean();
        let maintenance = 0, utilities = 0, other = 0;
        for (const e of expenses) {
          const cat = categorizeExpense((e as { name: string }).name);
          const amt = (e as { amount: number }).amount ?? 0;
          if (cat === 'maintenance') maintenance += amt;
          else if (cat === 'utilities') utilities += amt;
          else other += amt;
        }
        return { maintenance, utilities, other, total: maintenance + utilities + other };
      })(),
      Note.find({ userId: ownerId }).sort({ updatedAt: -1 }).limit(5).lean(),
    ]);

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const [totalRentIncome, totalExpenses, otherIncomeAgg, otherIncomeItems] = await Promise.all([
      RentPayment.aggregate([
        { $match: { tenantId: { $in: tenantIds }, paymentDate: { $gte: thisMonthStart, $lte: thisMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { userId: ownerId, date: { $gte: thisMonthStart, $lte: thisMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      OtherIncome.aggregate([
        { $match: { userId: ownerOid, isDeleted: false, date: { $gte: thisMonthStart, $lte: thisMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      OtherIncome.find({
        userId: ownerOid,
        isDeleted: false,
        date: { $gte: thisMonthStart, $lte: thisMonthEnd },
      })
        .sort({ date: -1 })
        .limit(10)
        .select('name amount date note')
        .lean(),
    ]);
    const monthlyRentIncome = totalRentIncome[0]?.total ?? 0;
    const monthlyExpenses = totalExpenses[0]?.total ?? 0;
    const otherIncomeMonth = otherIncomeAgg[0]?.total ?? 0;
    const totalIncomeMonth = monthlyRentIncome + otherIncomeMonth;
    const currentBalance = totalIncomeMonth - monthlyExpenses;

    const financialOverview = {
      monthlyRentCollected: monthlyRentIncome,
      otherIncome: otherIncomeMonth,
      totalIncome: totalIncomeMonth,
      maintenanceCost: expenseBreakdown.maintenance,
      utilities: expenseBreakdown.utilities,
      otherExpenses: expenseBreakdown.other,
      totalExpenses: expenseBreakdown.total,
      netBalance: currentBalance,
    };

    const activityPayments = recentPayments.slice(0, 5).map((p: Record<string, unknown>) => ({
      type: 'rent',
      label: `Rent payment received from ${(p.tenantId as { name?: string })?.name || 'Tenant'} — ₹${Number(p.amount ?? 0).toLocaleString('en-IN')}`,
      date: (p.paymentDate ?? p.createdAt) as Date | undefined,
    }));
    const activityNotes = recentNotesForActivity.slice(0, 3).map((n: Record<string, unknown>) => ({
      type: 'maintenance',
      label: `Maintenance request: ${(n.title as string) || 'Note'}`,
      date: n.updatedAt as Date | undefined,
    }));
    const recentActivity = [...activityPayments, ...activityNotes]
      .filter((a) => a.date)
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
      .slice(0, 8);

    return NextResponse.json({
      stats: {
        totalProperties,
        totalFlats,
        activeTenants,
        inactiveTenants,
        totalMonthlyRentIncome: monthlyRentIncome,
        totalExpenses: monthlyExpenses,
        currentBalance,
        otherIncomeMonth,
      },
      recentRentPayments: recentPayments,
      pendingRentList: rentDueItems.list,
      pendingDepositList: depositPendingItems.list,
      totalPendingRent: rentDueItems.total,
      totalPendingDeposit: depositPendingItems.total,
      pinnedNotes,
      cashFlowLast6Months: cashFlowMonths,
      financialOverview,
      recentActivity,
      otherIncomeItems: (otherIncomeItems as Array<{ _id: unknown; name: string; amount: number; date: Date; note?: string }>).map(
        (r) => ({
          _id: String(r._id),
          name: r.name,
          amount: r.amount,
          date: r.date,
          note: r.note,
        })
      ),
    });
  } catch (e) {
    console.error('Dashboard error:', e);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
