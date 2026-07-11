import { NextResponse } from "next/server";
import { getOldTenants } from "@/lib/tenant-storage";

export async function GET() {
  const tenants = await getOldTenants();
  return NextResponse.json({ tenants });
}
