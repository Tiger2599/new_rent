import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getOwnerSettings, updateOwnerSettings } from "@/lib/settings-storage";

export async function GET(request: Request) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const settings = await getOwnerSettings(session.ownerId);
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const body = (await request.json()) as { electricityRate?: unknown };
  const electricityRate = Number(body.electricityRate);

  if (!Number.isFinite(electricityRate) || electricityRate < 0) {
    return NextResponse.json(
      { error: "Electricity unit rate must be a number 0 or more." },
      { status: 400 },
    );
  }

  const settings = await updateOwnerSettings(session.ownerId, {
    electricityRate,
  });

  return NextResponse.json({ settings });
}
