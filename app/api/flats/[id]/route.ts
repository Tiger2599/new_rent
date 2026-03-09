import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Flat, Tenant } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId, canAccess } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'flats')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { id } = await params;
    const ownerId = getEffectiveUserId(auth.user);
    const flat = await Flat.findOne({ _id: id, userId: ownerId, isDeleted: false })
      .populate('propertyId', 'name propertyNumber address')
      .lean();
    if (!flat) return NextResponse.json({ error: 'Flat not found' }, { status: 404 });
    const currentTenant = await Tenant.findOne({ flatId: id, isActive: true, isDeleted: false }).lean();
    return NextResponse.json({ ...flat, currentTenant });
  } catch (e) {
    console.error('Flat get error:', e);
    return NextResponse.json({ error: 'Failed to fetch flat' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'flats')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { id } = await params;
    const ownerId = getEffectiveUserId(auth.user);
    const body = await request.json();
    const updated = await Flat.findOneAndUpdate(
      { _id: id, userId: ownerId, isDeleted: false },
      { $set: body },
      { new: true }
    ).populate('propertyId', 'name propertyNumber').lean();
    if (!updated) return NextResponse.json({ error: 'Flat not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    console.error('Flat update error:', e);
    return NextResponse.json({ error: 'Failed to update flat' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'flats')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { id } = await params;
    const ownerId = getEffectiveUserId(auth.user);
    const updated = await Flat.findOneAndUpdate(
      { _id: id, userId: ownerId, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    ).lean();
    if (!updated) return NextResponse.json({ error: 'Flat not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Flat delete error:', e);
    return NextResponse.json({ error: 'Failed to delete flat' }, { status: 500 });
  }
}
