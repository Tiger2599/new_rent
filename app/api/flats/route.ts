import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Flat } from '@/lib/models';
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
    const [items, total] = await Promise.all([
      Flat.find(query).sort({ flatNumber: 1 }).skip(skip).limit(limit).populate('propertyId', 'name propertyNumber').lean(),
      Flat.countDocuments(query),
    ]);
    return NextResponse.json({ items, total, page, limit });
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
