import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Tenant, Property, Flat } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId } from '@/lib/permissions';

/**
 * GET /api/search?q=query
 * Search tenants (name, mobile), properties (name), flats (flatNumber).
 */
export async function GET(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') ?? '').trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ tenants: [], properties: [], flats: [] });
    }
    const regex = new RegExp(q, 'i');
    const propertyIds = await Property.find({ userId: ownerId, isDeleted: false }).distinct('_id');

    const [tenants, properties, flats] = await Promise.all([
      Tenant.find({
        propertyId: { $in: propertyIds },
        isDeleted: false,
        $or: [{ name: regex }, { mobile: regex }],
      })
        .limit(15)
        .populate('propertyId', 'name propertyNumber')
        .populate('flatId', 'flatNumber')
        .lean(),
      Property.find({ userId: ownerId, isDeleted: false, name: regex }).limit(10).lean(),
      Flat.find({ userId: ownerId, isDeleted: false, flatNumber: regex })
        .populate('propertyId', 'name propertyNumber')
        .limit(10)
        .lean(),
    ]);

    return NextResponse.json({ tenants, properties, flats });
  } catch (e) {
    console.error('Search error:', e);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
