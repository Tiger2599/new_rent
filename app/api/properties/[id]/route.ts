import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Property, Flat, Tenant } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId, canAccess } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'properties')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { id } = await params;
    const ownerId = getEffectiveUserId(auth.user);
    const property = await Property.findOne({ _id: id, userId: ownerId, isDeleted: false }).lean();
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    const [flats, tenantCount] = await Promise.all([
      Flat.find({ propertyId: id, isDeleted: false }).sort({ flatNumber: 1 }).lean(),
      Tenant.countDocuments({ propertyId: id, isDeleted: false }),
    ]);
    const flatIds = flats.map((f) => f._id);
    const activeTenants = await Tenant.find({
      propertyId: id,
      flatId: { $in: flatIds },
      isActive: true,
      isDeleted: false,
    })
      .select('name flatId')
      .lean();
    const nameByFlat = new Map(activeTenants.map((t) => [String(t.flatId), t.name]));
    const flatsWithTenant = flats.map((f) => ({
      ...f,
      activeTenantName: nameByFlat.get(String(f._id)) ?? null,
    }));
    return NextResponse.json({ ...property, flats: flatsWithTenant, tenantCount });
  } catch (e) {
    console.error('Property get error:', e);
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'properties')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { id } = await params;
    const ownerId = getEffectiveUserId(auth.user);
    const body = await request.json();
    const updated = await Property.findOneAndUpdate(
      { _id: id, userId: ownerId, isDeleted: false },
      { $set: body },
      { new: true }
    ).lean();
    if (!updated) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    console.error('Property update error:', e);
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'properties')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { id } = await params;
    const ownerId = getEffectiveUserId(auth.user);
    const updated = await Property.findOneAndUpdate(
      { _id: id, userId: ownerId, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    ).lean();
    if (!updated) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Property delete error:', e);
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
  }
}
