import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { getCurrentUser } from '@/lib/api-auth';
import { hashPassword } from '@/lib/auth';
import { canAccess } from '@/lib/permissions';
import { ROLE_PERMISSIONS } from '@/lib/permissions';

/** List sub-users for the owner */
export async function GET(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'users')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (auth.user.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can list users' }, { status: 403 });
  }
  try {
    await connectDB();
    const ownerId = auth.user._id.toString();
    const users = await User.find({ ownerId }).select('-password').sort({ createdAt: -1 }).lean();
    return NextResponse.json({ items: users });
  } catch (e) {
    console.error('Users list error:', e);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

/** Create sub-user (owner only) */
export async function POST(request: Request) {
  const auth = await getCurrentUser(request);
  if (auth instanceof NextResponse) return auth;
  if (!canAccess(auth.user, 'users')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (auth.user.role !== 'owner') {
    return NextResponse.json({ error: 'Only owner can create sub-users' }, { status: 403 });
  }
  try {
    await connectDB();
    const ownerId = auth.user._id.toString();
    const body = await request.json();
    const { name, email, password, mobile, role, permissions } = body;
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    const roleVal = ['manager', 'accountant', 'viewer'].includes(role) ? role : 'viewer';
    const perms = permissions && typeof permissions === 'object'
      ? { ...ROLE_PERMISSIONS[roleVal], ...permissions }
      : ROLE_PERMISSIONS[roleVal];
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }
    const hashed = await hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      mobile: mobile?.trim() ?? '',
      role: roleVal,
      ownerId,
      permissions: perms,
      isActive: true,
    });
    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (e) {
    console.error('User create error:', e);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
