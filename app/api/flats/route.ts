import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Flat, Tenant } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId, canAccess } from '@/lib/permissions';

export async function GET(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'flats')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(10, parseInt(searchParams.get('limit') ?? '20', 10)));
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = { userId: ownerId, isDeleted: false };
    if (propertyId) query.propertyId = propertyId;
    const activeOnly = searchParams.get('active');
    if (activeOnly === 'true') (query as Record<string, unknown>).isActive = true;

    const vacantOnly = searchParams.get('vacant') === 'true';
    const includeFlatId = searchParams.get('includeFlatId');

    /** Vacant flats for a property (no active tenant), optional include current flat for edit */
    if (vacantOnly && propertyId) {
      const allFlatDocs = await Flat.find(query).sort({ flatNumber: 1 }).lean();
      const allIds = allFlatDocs.map((f) => f._id);
      const occupied = await Tenant.find({
        flatId: { $in: allIds },
        isActive: true,
        isDeleted: false,
      }).distinct('flatId');
      const occupiedSet = new Set(occupied.map((id) => String(id)));
      let allowedDocs = allFlatDocs.filter((f) => !occupiedSet.has(String(f._id)));
      if (includeFlatId) {
        const inc = allFlatDocs.find((f) => String(f._id) === String(includeFlatId));
        if (inc && !allowedDocs.some((f) => String(f._id) === String(includeFlatId))) {
          allowedDocs = [...allowedDocs, inc];
        }
      }
      allowedDocs.sort((a, b) =>
        String(a.flatNumber).localeCompare(String(b.flatNumber), undefined, { numeric: true })
      );
      const idsOrdered = allowedDocs.map((f) => f._id);
      const populated =
        idsOrdered.length === 0
          ? []
          : await Flat.find({ _id: { $in: idsOrdered } })
              .populate('propertyId', 'name propertyNumber')
              .lean();
      const orderMap = new Map(idsOrdered.map((id, i) => [String(id), i]));
      populated.sort((a, b) => (orderMap.get(String(a._id)) ?? 0) - (orderMap.get(String(b._id)) ?? 0));
      const itemsWithOccupancy = (populated as Record<string, unknown>[]).map((f) => ({
        ...f,
        hasActiveTenant: occupiedSet.has(String(f._id)),
      }));
      return NextResponse.json({
        items: itemsWithOccupancy,
        total: itemsWithOccupancy.length,
        page: 1,
        limit: itemsWithOccupancy.length,
      });
    }

    const [items, total] = await Promise.all([
      Flat.find(query).sort({ flatNumber: 1 }).skip(skip).limit(limit).populate('propertyId', 'name propertyNumber').lean(),
      Flat.countDocuments(query),
    ]);
    const flatIds = (items as { _id: mongoose.Types.ObjectId }[]).map((f) => f._id);
    const occupiedFlatIds = await Tenant.find(
      { flatId: { $in: flatIds }, isActive: true, isDeleted: false },
      { flatId: 1 }
    ).distinct('flatId');
    const occupiedSet = new Set(occupiedFlatIds.map((id) => String(id)));
    const itemsWithOccupancy = (items as Record<string, unknown>[]).map((f) => ({
      ...f,
      hasActiveTenant: occupiedSet.has(String(f._id)),
    }));
    return NextResponse.json({ items: itemsWithOccupancy, total, page, limit });
  } catch (e) {
    console.error('Flats list error:', e);
    return NextResponse.json({ error: 'Failed to fetch flats' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'flats')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const body = await request.json();
    const { flatNumber, propertyId } = body;
    if (!flatNumber || !propertyId) {
      return NextResponse.json({ error: 'Flat number and property are required' }, { status: 400 });
    }
    let propertyObjId: mongoose.Types.ObjectId;
    try {
      propertyObjId = new mongoose.Types.ObjectId(String(propertyId));
    } catch {
      return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
    }
    const { Property } = await import('@/lib/models');
    const prop = await Property.findOne({ _id: propertyObjId, userId: ownerId, isDeleted: false });
    if (!prop) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    const flat = await Flat.create({
      flatNumber: String(flatNumber).trim(),
      propertyId: propertyObjId,
      userId: ownerId,
    });
    const populated = await flat.populate('propertyId', 'name propertyNumber');
    return NextResponse.json({ _id: populated._id, flatNumber: populated.flatNumber });
  } catch (e) {
    console.error('Flat create error:', e);
    return NextResponse.json({ error: 'Failed to create flat' }, { status: 500 });
  }
}
