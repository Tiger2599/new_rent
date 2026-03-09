/**
 * Middleware helper: get current user from request or return 401.
 */
import { NextResponse } from 'next/server';
import { connectDB } from './db';
import { User } from './models';
import { getAuthTokenFromRequest, verifyToken } from './auth';
export async function getCurrentUser(request: Request): Promise<{ user: { _id: unknown; email: string; name: string; role: string; ownerId?: unknown; permissions?: Record<string, boolean> } } | NextResponse> {
  const token = getAuthTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
  await connectDB();
  const user = await User.findOne({ _id: payload.userId, isActive: true }).lean();
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }
  return { user: user as { _id: unknown; email: string; name: string; role: string; ownerId?: unknown; permissions?: Record<string, boolean> } };
}

/** Resolve effective owner ID: for sub-users this is ownerId, for owner it's their _id */
export function getEffectiveOwnerId(user: { _id: unknown; ownerId?: unknown }): string {
  return String(user.ownerId ?? user._id);
}
