import { NextResponse } from "next/server";
import { backfillLegacyOwners, findUserById, type UserRecord } from "@/lib/users";
import type { UserRole } from "@/lib/auth";

export type Session = {
  userId: number;
  ownerId: string;
  name: string;
  email: string;
  role: UserRole;
};

export async function getSession(request: Request): Promise<Session | null> {
  await backfillLegacyOwners();
  const userId = Number(request.headers.get("x-user-id"));
  if (!Number.isInteger(userId) || userId <= 0) return null;

  const user: UserRecord | null = await findUserById(userId);
  if (!user?.ownerId) return null;

  return {
    userId: user.id,
    ownerId: user.ownerId,
    name: user.name,
    email: user.email,
    role: user.role === "owner" ? "owner" : "admin",
  };
}

export async function requireSession(request: Request): Promise<
  | { session: Session; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await getSession(request);
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Please log in." }, { status: 401 }),
    };
  }
  return { session, error: null };
}
