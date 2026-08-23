import { NextResponse } from "next/server";
import { getOldTenants } from "@/lib/tenant-storage";
import { requireSession } from "@/lib/session";

export async function GET(request: Request) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const tenants = await getOldTenants(session.ownerId);
  return NextResponse.json({ tenants });
}
