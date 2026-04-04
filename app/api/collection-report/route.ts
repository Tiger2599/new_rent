import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { RentPayment, Tenant, Property } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId, canAccess } from '@/lib/permissions';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function GET(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'rent') && !canAccess(auth.user, 'payments')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const propertyIds = await Property.find({ userId: ownerId, isDeleted: false }).distinct('_id');
    const tenantIds = await Tenant.find({ propertyId: { $in: propertyIds } }).distinct('_id');

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const now = new Date();
    const to = toParam ? endOfDay(new Date(toParam)) : now;
    const from = fromParam ? startOfDay(new Date(fromParam)) : startOfDay(subDays(now, 30));

    // Daily collection: group by paymentDate (day), sum amount
    const dailyAgg = await RentPayment.aggregate([
      { $match: { tenantId: { $in: tenantIds }, paymentDate: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const dailyReport = dailyAgg.map((d: { _id: string; totalAmount: number; count: number }) => ({
      date: d._id,
      totalAmount: d.totalAmount,
      count: d.count,
    }));

    // Total collection for the period
    const periodSum = await RentPayment.aggregate([
      { $match: { tenantId: { $in: tenantIds }, paymentDate: { $gte: from, $lte: to } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalCollection = periodSum[0]?.total ?? 0;

    // All-time total collection
    const allTimeAgg = await RentPayment.aggregate([
      { $match: { tenantId: { $in: tenantIds } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const allTimeTotal = allTimeAgg[0]?.total ?? 0;

    return NextResponse.json({
      dailyReport,
      totalCollection,
      allTimeTotal,
      from: from.toISOString(),
      to: to.toISOString(),
    });
  } catch (e) {
    console.error('Collection report error:', e);
    return NextResponse.json({ error: 'Failed to fetch collection report' }, { status: 500 });
  }
}
