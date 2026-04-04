import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Tenant, Property } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId, canAccess } from '@/lib/permissions';

async function getTenantForUser(tenantId: string, ownerId: string) {
  const propertyIds = await Property.find({ userId: ownerId, isDeleted: false }).distinct('_id');
  return Tenant.findOne({
    _id: tenantId,
    propertyId: { $in: propertyIds },
    isDeleted: false,
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'tenants')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { id } = await params;
    const ownerId = getEffectiveUserId(auth.user);
    const tenant = await getTenantForUser(id, ownerId);
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    const populated = await Tenant.findById(tenant._id)
      .populate('propertyId', 'name propertyNumber address')
      .populate('flatId', 'flatNumber')
      .lean();
    return NextResponse.json(populated);
  } catch (e) {
    console.error('Tenant get error:', e);
    return NextResponse.json({ error: 'Failed to fetch tenant' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'tenants')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { id } = await params;
    const ownerId = getEffectiveUserId(auth.user);
    const tenant = await getTenantForUser(id, ownerId);
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    const body = await request.json();
    const allowed = [
      'name', 'mobile', 'rentAmount', 'depositAmount', 'depositPending',
      'joinDate', 'leaveDate', 'notes', 'isActive', 'propertyId', 'flatId',
    ];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === 'joinDate' || key === 'leaveDate') update[key] = body[key] ? new Date(body[key]) : body[key];
        else update[key] = body[key];
      }
    }
    // When activating a tenant, ensure the flat has no other active tenant
    if (body.isActive === true && tenant.flatId) {
      const otherActive = await Tenant.findOne({
        flatId: tenant.flatId,
        isActive: true,
        isDeleted: false,
        _id: { $ne: id },
      });
      if (otherActive) {
        const otherName = (otherActive as { name?: string }).name ?? 'Another tenant';
        return NextResponse.json(
          { error: `In that flat, ${otherName} already lives. Cannot activate.` },
          { status: 400 }
        );
      }
    }
    const updated = await Tenant.findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate('propertyId', 'name propertyNumber')
      .populate('flatId', 'flatNumber')
      .lean();
    return NextResponse.json(updated);
  } catch (e) {
    console.error('Tenant update error:', e);
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'tenants')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { id } = await params;
    const ownerId = getEffectiveUserId(auth.user);
    const tenant = await getTenantForUser(id, ownerId);
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    await Tenant.findByIdAndUpdate(id, { $set: { isDeleted: true } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Tenant delete error:', e);
    return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 500 });
  }
}
