import { NextResponse } from "next/server";
import { searchTenants } from "@/lib/tenant-storage";
import { requireSession } from "@/lib/session";

export async function GET(request: Request) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json({ tenants: [] });
  }

  const tenants = await searchTenants(session.ownerId, q, 12);

  return NextResponse.json({
    tenants: tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      mobile: tenant.mobile,
      buildingNumber: tenant.buildingNumber,
      roomNumber: tenant.roomNumber,
      rent: tenant.rent,
      removedAt: tenant.removedAt,
    })),
  });
}
