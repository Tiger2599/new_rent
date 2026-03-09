import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Note } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId, canAccess } from '@/lib/permissions';

export async function GET(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'notes')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const { searchParams } = new URL(request.url);
    const pinnedOnly = searchParams.get('pinned') === 'true';
    const query: Record<string, unknown> = { userId: ownerId };
    if (pinnedOnly) query.isPinned = true;
    const items = await Note.find(query).sort({ isPinned: -1, createdAt: -1 }).lean();
    return NextResponse.json({ items });
  } catch (e) {
    console.error('Notes list error:', e);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'notes')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const body = await request.json();
    const { title, description, isPinned } = body;
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    const note = await Note.create({
      title: title.trim(),
      description: description?.trim() ?? '',
      isPinned: !!isPinned,
      userId: ownerId,
    });
    return NextResponse.json(note.toObject());
  } catch (e) {
    console.error('Note create error:', e);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
