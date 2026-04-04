import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Tenant, Property, RentPayment, Flat } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId, canAccess } from '@/lib/permissions';
import { rentDueForMonth } from '@/lib/rent-calc';
import { startOfMonth, subMonths } from 'date-fns';

/**
 * GET /api/rent/due
 * Returns list of tenants with due amount for current month (and previous unpaid).
 */
export async function GET(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'rent')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const propertyIds = await Property.find({ userId: ownerId, isDeleted: false }).distinct('_id');
    const activeFlatIds = await Flat.find({ userId: ownerId, isDeleted: false, isActive: { $ne: false } }).distinct('_id');
    const tenants = await Tenant.find({
      propertyId: { $in: propertyIds },
      flatId: { $in: activeFlatIds },
      isActive: true,
      isDeleted: false,
    })
      .populate('propertyId', 'name propertyNumber')
      .populate('flatId', 'flatNumber')
      .lean();

    const now = new Date();
    const thisMonth = startOfMonth(now);
    const dueList: Array<{
      tenant: typeof tenants[0];
      dueThisMonth: number;
      paidThisMonth: number;
      lastPaidDate: string | null;
      dueAmount: number;
      depositPending: number;
    }> = [];

    for (const tenant of tenants) {
      const t = tenant as unknown as { _id: string; joinDate: Date; leaveDate?: Date; rentAmount: number; depositPending?: number };
      const dueThisMonth = rentDueForMonth(
        t.rentAmount,
        new Date(t.joinDate),
        t.leaveDate ? new Date(t.leaveDate) : null,
        thisMonth
      );
      const paymentsThisMonth = await RentPayment.find({
        tenantId: t._id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      }).lean();
      const paidThisMonth = paymentsThisMonth.reduce((s, p) => s + (p as { amount: number }).amount, 0);
      const lastPayment = await RentPayment.findOne({ tenantId: t._id })
        .sort({ paymentDate: -1 })
        .select('paymentDate')
        .lean();
      let dueAmount = Math.max(0, dueThisMonth - paidThisMonth);

      // All previous unpaid months (up to 12 months back)
      for (let i = 1; i <= 12; i++) {
        const prevMonth = subMonths(thisMonth, i);
        const duePrev = rentDueForMonth(
          t.rentAmount,
          new Date(t.joinDate),
          t.leaveDate ? new Date(t.leaveDate) : null,
          prevMonth
        );
        if (duePrev <= 0) continue;
        const paidPrev = await RentPayment.aggregate([
          { $match: { tenantId: t._id, month: prevMonth.getMonth() + 1, year: prevMonth.getFullYear() } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const paid = paidPrev[0]?.total ?? 0;
        dueAmount += Math.max(0, duePrev - paid);
      }

      const depositPending = Number(t.depositPending) || 0;
      dueList.push({
        tenant,
        dueThisMonth,
        paidThisMonth,
        lastPaidDate: lastPayment ? (lastPayment as { paymentDate: Date }).paymentDate?.toISOString?.() ?? null : null,
        dueAmount,
        depositPending,
      });
    }

    return NextResponse.json({
      items: dueList.filter((d) => d.dueAmount > 0),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
  } catch (e) {
    console.error('Rent due list error:', e);
    return NextResponse.json({ error: 'Failed to fetch rent due' }, { status: 500 });
  }
}
