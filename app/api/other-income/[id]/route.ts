import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { OtherIncome } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId, canAccess } from '@/lib/permissions';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'expenses') && !canAccess(auth.user, 'balanceSheet')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const ownerOid = new mongoose.Types.ObjectId(String(ownerId));
    const { id } = await params;
    const doc = await OtherIncome.findOne({ _id: id, userId: ownerOid, isDeleted: false });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await OtherIncome.findByIdAndUpdate(id, { $set: { isDeleted: true } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Other income delete error:', e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
