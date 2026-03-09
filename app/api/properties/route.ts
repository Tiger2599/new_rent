import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Property, Flat, Tenant } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId } from '@/lib/permissions';
import { canAccess } from '@/lib/permissions';

export async function GET(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'properties')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(10, parseInt(searchParams.get('limit') ?? '20', 10)));
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Property.find({ userId: ownerId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Property.countDocuments({ userId: ownerId, isDeleted: false }),
    ]);
    const ids = (items as { _id: unknown }[]).map((p) => p._id);
    const [flatCounts, tenantCounts] = await Promise.all([
      Flat.aggregate([{ $match: { propertyId: { $in: ids }, isDeleted: false } }, { $group: { _id: '$propertyId', count: { $sum: 1 } } }]),
      Tenant.aggregate([{ $match: { propertyId: { $in: ids }, isDeleted: false } }, { $group: { _id: '$propertyId', count: { $sum: 1 } } }]),
    ]);
    const flatMap = Object.fromEntries((flatCounts as { _id: unknown; count: number }[]).map((d) => [d._id.toString(), d.count]));
    const tenantMap = Object.fromEntries((tenantCounts as { _id: unknown; count: number }[]).map((d) => [d._id.toString(), d.count]));
    const itemsWithCounts = (items as { _id: { toString: () => string } }[]).map((p) => ({
      ...p,
      totalFlats: flatMap[p._id.toString()] ?? 0,
      totalTenants: tenantMap[p._id.toString()] ?? 0,
    }));
    return NextResponse.json({ items: itemsWithCounts, total, page, limit });
  } catch (e) {
    console.error('Properties list error:', e);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'properties')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const body = await request.json();
    const { name, propertyNumber, address, flats } = body;
    if (!name || !propertyNumber || !address) {
      return NextResponse.json(
        { error: 'Property name, number and address are required' },
        { status: 400 }
      );
    }
    const { Flat } = await import('@/lib/models');
    const property = await Property.create({
      name: name.trim(),
      propertyNumber: String(propertyNumber).trim(),
      address: address.trim(),
      userId: ownerId,
    });
    if (Array.isArray(flats) && flats.length > 0) {
      await Flat.insertMany(
        flats.map((f: { flatNumber: string }) => ({
          flatNumber: String(f.flatNumber).trim(),
          propertyId: property._id,
          userId: ownerId,
        }))
      );
    }
    const populated = await Property.findById(property._id).lean();
    return NextResponse.json(populated);
  } catch (e) {
    console.error('Property create error:', e);
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}
