import { NextResponse } from "next/server";
import { getActiveTenants, getOldTenants } from "@/lib/tenant-storage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

  if (!q) {
    return NextResponse.json({ tenants: [] });
  }

  const [active, old] = await Promise.all([
    getActiveTenants(),
    getOldTenants(),
  ]);

  const tenants = [...active, ...old]
    .filter((tenant) => {
      const name = tenant.name.toLowerCase();
      const mobile = tenant.mobile.toLowerCase();
      const building = tenant.buildingNumber.toLowerCase();
      const room = tenant.roomNumber.toLowerCase();
      return (
        name.includes(q) ||
        mobile.includes(q) ||
        building.includes(q) ||
        room.includes(q) ||
        `${building}/${room}`.includes(q)
      );
    })
    .slice(0, 12)
    .map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      mobile: tenant.mobile,
      buildingNumber: tenant.buildingNumber,
      roomNumber: tenant.roomNumber,
      rent: tenant.rent,
      removedAt: tenant.removedAt,
    }));

  return NextResponse.json({ tenants });
}
