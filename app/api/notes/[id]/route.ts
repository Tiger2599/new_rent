import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Note } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId, canAccess } from '@/lib/permissions';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'notes')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { id } = await params;
    const ownerId = getEffectiveUserId(auth.user);
    const body = await request.json();
    const updated = await Note.findOneAndUpdate(
      { _id: id, userId: ownerId },
      { $set: body },
      { new: true }
    ).lean();
    if (!updated) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    console.error('Note update error:', e);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'notes')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { id } = await params;
    const ownerId = getEffectiveUserId(auth.user);
    const deleted = await Note.findOneAndDelete({ _id: id, userId: ownerId });
    if (!deleted) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Note delete error:', e);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
