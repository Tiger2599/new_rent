import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Expense } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { getEffectiveUserId, canAccess } from '@/lib/permissions';
import { startOfMonth, endOfMonth } from 'date-fns';

const CATEGORIES = ['maintenance', 'utilities', 'cleaning', 'security', 'other'] as const;

export async function GET(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'expenses')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(10, parseInt(searchParams.get('limit') ?? '20', 10)));
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId: ownerId };
    if (month && year) {
      const start = startOfMonth(new Date(Number(year), Number(month) - 1));
      const end = endOfMonth(new Date(Number(year), Number(month) - 1));
      filter.date = { $gte: start, $lte: end };
    }

    const [items, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip(skip).limit(limit)
        .populate('propertyId', 'name')
        .populate('flatId', 'flatNumber')
        .lean(),
      Expense.countDocuments(filter),
    ]);
    return NextResponse.json({ items, total, page, limit });
  } catch (e) {
    console.error('Expenses list error:', e);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'expenses')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const ownerId = getEffectiveUserId(auth.user);
    const body = await request.json();
    const { name, amount, date, note, category, propertyId, flatId } = body;
    if (!name || amount == null || !date) {
      return NextResponse.json(
        { error: 'Expense name, amount and date are required' },
        { status: 400 }
      );
    }
    const create: Record<string, unknown> = {
      name: name.trim(),
      amount: Number(amount),
      date: new Date(date),
      note: note?.trim() ?? '',
      userId: ownerId,
    };
    if (category && CATEGORIES.includes(category)) create.category = category;
    if (propertyId) create.propertyId = propertyId;
    if (flatId) create.flatId = flatId;
    const expense = await Expense.create(create);
    return NextResponse.json(expense.toObject());
  } catch (e) {
    console.error('Expense create error:', e);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
