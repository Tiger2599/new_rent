import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/api-auth';

export async function GET(request: Request) {
  const result = await getCurrentUser(request);
  if (result instanceof NextResponse) return result;
  const { user } = result;
  return NextResponse.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      ownerId: user.ownerId,
      permissions: user.permissions,
    },
  });
}
