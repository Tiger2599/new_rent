import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Tenant, Property } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId, canAccess } from '@/lib/permissions';

export async function GET(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'tenants')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const propertyIds = await Property.find({ userId: ownerId, isDeleted: false }).distinct('_id');
    const { Flat } = await import('@/lib/models');
    const activeFlatIds = await Flat.find({ userId: ownerId, isDeleted: false, isActive: { $ne: false } }).distinct('_id');
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(10, parseInt(searchParams.get('limit') ?? '20', 10)));
    const skip = (page - 1) * limit;
    const activeFilter = searchParams.get('active');
    const query: Record<string, unknown> = { propertyId: { $in: propertyIds }, flatId: { $in: activeFlatIds }, isDeleted: false };
    if (activeFilter === 'true') query.isActive = true;
    if (activeFilter === 'false') query.isActive = false;
    const [items, total] = await Promise.all([
      Tenant.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('propertyId', 'name propertyNumber')
        .populate('flatId', 'flatNumber')
        .lean(),
      Tenant.countDocuments(query),
    ]);
    return NextResponse.json({ items, total, page, limit });
  } catch (e) {
    console.error('Tenants list error:', e);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'tenants')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const body = await request.json();
    const {
      name,
      mobile,
      rentAmount,
      depositAmount = 0,
      depositPending = 0,
      joinDate,
      propertyId,
      flatId,
      notes,
    } = body;
    if (!name || !mobile || rentAmount == null || !joinDate || !propertyId || !flatId) {
      return NextResponse.json(
        { error: 'Name, mobile, rent amount, join date, property and flat are required' },
        { status: 400 }
      );
    }
    const prop = await Property.findOne({ _id: propertyId, userId: ownerId, isDeleted: false });
    if (!prop) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    const { Flat } = await import('@/lib/models');
    const flat = await Flat.findOne({ _id: flatId, propertyId, userId: ownerId, isDeleted: false });
    if (!flat) return NextResponse.json({ error: 'Flat not found' }, { status: 404 });
    // One tenant per flat: vacate any existing active tenant in this flat
    const joinD = new Date(joinDate);
    await Tenant.updateMany(
      { flatId, isActive: true, isDeleted: false },
      { $set: { isActive: false, leaveDate: joinD } }
    );
    const tenant = await Tenant.create({
      name: name.trim(),
      mobile: String(mobile).trim(),
      rentAmount: Number(rentAmount),
      depositAmount: Number(depositAmount) || 0,
      depositPending: Number(depositPending) || 0,
      joinDate: new Date(joinDate),
      propertyId,
      flatId,
      notes: notes?.trim() ?? '',
      isActive: true,
    });
    const populated = await Tenant.findById(tenant._id)
      .populate('propertyId', 'name propertyNumber')
      .populate('flatId', 'flatNumber')
      .lean();
    return NextResponse.json(populated);
  } catch (e) {
    console.error('Tenant create error:', e);
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 });
  }
}
