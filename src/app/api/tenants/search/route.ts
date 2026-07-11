import { NextResponse } from "next/server";
import { searchTenants } from "@/lib/tenant-storage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json({ tenants: [] });
  }

  const tenants = await searchTenants(q, 12);

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
