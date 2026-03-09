import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { RentPayment, Tenant, Property } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId, canAccess } from '@/lib/permissions';

export async function GET(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'rent')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const propertyIds = await Property.find({ userId: ownerId, isDeleted: false }).distinct('_id');
    const tenantIds = await Tenant.find({ propertyId: { $in: propertyIds } }).distinct('_id');
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get('limit') ?? '10', 10)));
    const items = await RentPayment.find({ tenantId: { $in: tenantIds } })
      .sort({ paymentDate: -1 })
      .limit(limit)
      .populate('tenantId', 'name propertyId flatId')
      .lean();
    return NextResponse.json({ items });
  } catch (e) {
    console.error('Rent payments list error:', e);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'payments')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const propertyIds = await Property.find({ userId: ownerId, isDeleted: false }).distinct('_id');
    const body = await request.json();
    const { tenantId, amount, paymentDate, month, year, note } = body;
    if (!tenantId || amount == null || !paymentDate || month == null || year == null) {
      return NextResponse.json(
        { error: 'Tenant, amount, payment date, month and year are required' },
        { status: 400 }
      );
    }
    if (Number(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }
    const tenant = await Tenant.findOne({
      _id: tenantId,
      propertyId: { $in: propertyIds },
      isDeleted: false,
    });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    const d = new Date(paymentDate);
    const pay = await RentPayment.create({
      tenantId,
      amount: Number(amount),
      paymentDate: d,
      month: Number(month),
      year: Number(year),
      note: note?.trim(),
    });
    const populated = await RentPayment.findById(pay._id)
      .populate('tenantId', 'name propertyId flatId')
      .lean();
    return NextResponse.json(populated);
  } catch (e) {
    console.error('Rent payment create error:', e);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
