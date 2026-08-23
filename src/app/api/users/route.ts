import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { createSubUser, getPublicUsers } from "@/lib/users";

export async function GET(request: Request) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const users = await getPublicUsers(session.ownerId);
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
  };

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email and password are required." },
      { status: 400 },
    );
  }

  if (password.length < 4) {
    return NextResponse.json(
      { error: "Password must be at least 4 characters." },
      { status: 400 },
    );
  }

  try {
    const user = await createSubUser({
      name,
      email,
      password,
      ownerId: session.ownerId,
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create user.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
