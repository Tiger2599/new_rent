import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { OtherIncome } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId, canAccess } from '@/lib/permissions';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'expenses') && !canAccess(auth.user, 'balanceSheet')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const ownerOid = new mongoose.Types.ObjectId(String(ownerId));
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1), 10);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    const items = await OtherIncome.find({
      userId: ownerOid,
      isDeleted: false,
      date: { $gte: start, $lte: end },
    })
      .sort({ date: -1 })
      .lean();
    const total = items.reduce((s, i) => s + (i.amount ?? 0), 0);
    return NextResponse.json({ items, total });
  } catch (e) {
    console.error('Other income list error:', e);
    return NextResponse.json({ error: 'Failed to fetch other income' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'expenses') && !canAccess(auth.user, 'balanceSheet')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const ownerOid = new mongoose.Types.ObjectId(String(ownerId));
    const body = await request.json();
    const { name, amount, date, note } = body;
    if (!name || name == null || amount == null || !date) {
      return NextResponse.json({ error: 'Name, amount and date are required' }, { status: 400 });
    }
    if (Number(amount) < 0) {
      return NextResponse.json({ error: 'Amount must be 0 or more' }, { status: 400 });
    }
    const created = await OtherIncome.create({
      name: String(name).trim(),
      amount: Number(amount),
      date: new Date(date),
      note: note?.trim() || undefined,
      userId: ownerOid,
    });
    return NextResponse.json({
      _id: created._id,
      name: created.name,
      amount: created.amount,
      date: created.date,
      note: created.note,
    });
  } catch (e) {
    console.error('Other income create error:', e);
    return NextResponse.json({ error: 'Failed to save other income' }, { status: 500 });
  }
}
