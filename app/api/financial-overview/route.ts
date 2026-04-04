import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Property, Tenant, RentPayment, Expense } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId, canAccess } from '@/lib/permissions';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function deriveCategory(name: string, category?: string): string {
  if (category) return category;
  const n = (name || '').toLowerCase();
  if (n.includes('maintenance') || n.includes('repair')) return 'maintenance';
  if (n.includes('utility') || n.includes('electric') || n.includes('water') || n.includes('gas')) return 'utilities';
  if (n.includes('clean')) return 'cleaning';
  if (n.includes('security') || n.includes('guard')) return 'security';
  return 'other';
}

export async function GET(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'expenses') && !canAccess(auth.user, 'balanceSheet')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1), 10);

    const propertyIds = await Property.find({ userId: ownerId, isDeleted: false }).distinct('_id');
    const tenantIds = await Tenant.find({ propertyId: { $in: propertyIds } }).distinct('_id');

    const selectedStart = startOfMonth(new Date(year, month - 1));
    const selectedEnd = endOfMonth(new Date(year, month - 1));

    // Summary for selected month
    const [rentIncome, depositAgg, expensesTotal, expensesList] = await Promise.all([
      RentPayment.aggregate([
        { $match: { tenantId: { $in: tenantIds }, paymentDate: { $gte: selectedStart, $lte: selectedEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Tenant.aggregate([
        { $match: { propertyId: { $in: propertyIds }, joinDate: { $gte: selectedStart, $lte: selectedEnd } } },
        { $project: { received: { $subtract: ['$depositAmount', '$depositPending'] } } },
        { $group: { _id: null, total: { $sum: '$received' } } },
      ]),
      Expense.aggregate([
        { $match: { userId: ownerId, date: { $gte: selectedStart, $lte: selectedEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.find({ userId: ownerId, date: { $gte: selectedStart, $lte: selectedEnd } })
        .sort({ date: -1 })
        .populate('propertyId', 'name')
        .populate('flatId', 'flatNumber')
        .lean(),
    ]);

    const totalRentIncome = rentIncome[0]?.total ?? 0;
    const totalDeposits = Math.max(0, depositAgg[0]?.total ?? 0);
    const totalExpenses = expensesTotal[0]?.total ?? 0;
    const netBalance = totalRentIncome + totalDeposits - totalExpenses;

    // Monthly sheet for the full year
    const monthlySheet: Array<{
      month: number;
      year: number;
      monthLabel: string;
      rentIncome: number;
      depositReceived: number;
      expenses: number;
      netBalance: number;
    }> = [];
    for (let m = 1; m <= 12; m++) {
      const start = startOfMonth(new Date(year, m - 1));
      const end = endOfMonth(new Date(year, m - 1));
      const [r, d, e] = await Promise.all([
        RentPayment.aggregate([
          { $match: { tenantId: { $in: tenantIds }, paymentDate: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Tenant.aggregate([
          { $match: { propertyId: { $in: propertyIds }, joinDate: { $gte: start, $lte: end } } },
          { $project: { received: { $subtract: ['$depositAmount', '$depositPending'] } } },
          { $group: { _id: null, total: { $sum: '$received' } } },
        ]),
        Expense.aggregate([
          { $match: { userId: ownerId, date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);
      const ri = r[0]?.total ?? 0;
      const dep = Math.max(0, d[0]?.total ?? 0);
      const exp = e[0]?.total ?? 0;
      monthlySheet.push({
        month: m,
        year,
        monthLabel: `${MONTHS[m - 1]} ${year}`,
        rentIncome: ri,
        depositReceived: dep,
        expenses: exp,
        netBalance: ri + dep - exp,
      });
    }

    // Category breakdown for selected month
    const categoryBreakdown = { maintenance: 0, utilities: 0, cleaning: 0, security: 0, other: 0 };
    for (const ex of expensesList as Array<{ name?: string; amount?: number; category?: string }>) {
      const cat = deriveCategory(ex.name ?? '', ex.category) as keyof typeof categoryBreakdown;
      if (categoryBreakdown[cat] !== undefined) categoryBreakdown[cat] += ex.amount ?? 0;
    }

    // Enrich expenses with derived category and property/flat display
    const expenses = (expensesList as Array<{ name?: string; amount?: number; date?: Date; note?: string; category?: string; propertyId?: { name: string }; flatId?: { flatNumber: string }; _id: unknown }>).map((ex) => ({
      _id: ex._id,
      name: ex.name,
      amount: ex.amount,
      date: ex.date,
      note: ex.note,
      category: deriveCategory(ex.name ?? '', ex.category),
      propertyFlat: ex.propertyId?.name
        ? (ex.flatId?.flatNumber ? `${ex.propertyId.name} / ${ex.flatId.flatNumber}` : ex.propertyId.name)
        : '-',
    }));

    return NextResponse.json({
      summary: {
        totalRentIncome,
        totalDeposits,
        totalExpenses,
        netBalance,
      },
      monthlySheet,
      expenses,
      categoryBreakdown: [
        { name: 'Maintenance', value: categoryBreakdown.maintenance, key: 'maintenance' },
        { name: 'Utilities', value: categoryBreakdown.utilities, key: 'utilities' },
        { name: 'Cleaning', value: categoryBreakdown.cleaning, key: 'cleaning' },
        { name: 'Security', value: categoryBreakdown.security, key: 'security' },
        { name: 'Other', value: categoryBreakdown.other, key: 'other' },
      ],
    });
  } catch (e) {
    console.error('Financial overview error:', e);
    return NextResponse.json({ error: 'Failed to load financial overview' }, { status: 500 });
  }
}
