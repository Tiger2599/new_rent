import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { deleteUser } from "@/lib/users";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const { id } = await context.params;
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  try {
    const deleted = await deleteUser(userId, session.ownerId, session.userId);
    if (!deleted) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete user.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
