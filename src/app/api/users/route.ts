import { NextResponse } from "next/server";
import { createUser, getPublicUsers } from "@/lib/users";

export async function GET() {
  const users = await getPublicUsers();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
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
    const user = await createUser({ name, email, password });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create user.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
