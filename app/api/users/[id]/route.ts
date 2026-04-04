import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { hashPassword } from '@/lib/auth';
import { canAccess } from '@/lib/permissions';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'users')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (auth.user.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can edit users' }, { status: 403 });
  }
  try {
    await connectDB();
    const { id } = await params;
    const ownerId = String(auth.user._id);
    const body = await request.json();
    const subUser = await User.findOne({ _id: id, ownerId });
    if (!subUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.mobile !== undefined) update.mobile = body.mobile;
    if (body.role !== undefined && ['manager', 'accountant', 'viewer'].includes(body.role)) {
      update.role = body.role;
    }
    if (body.permissions !== undefined && typeof body.permissions === 'object') {
      update.permissions = body.permissions;
    }
    if (body.isActive !== undefined) update.isActive = !!body.isActive;
    if (body.password !== undefined && body.password.length >= 6) {
      update.password = await hashPassword(body.password);
    }

    const updated = await User.findByIdAndUpdate(id, { $set: update }, { new: true })
      .select('-password')
      .lean();
    return NextResponse.json(updated);
  } catch (e) {
    console.error('User update error:', e);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'users')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (auth.user.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can deactivate users' }, { status: 403 });
  }
  try {
    await connectDB();
    const { id } = await params;
    const ownerId = String(auth.user._id);
    const updated = await User.findOneAndUpdate(
      { _id: id, ownerId },
      { $set: { isActive: false } },
      { new: true }
    ).lean();
    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('User delete error:', e);
    return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
  }
}
