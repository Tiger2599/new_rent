import { NextResponse } from "next/server";
import { addRentPayment } from "@/lib/rent-storage";
import { addTenant, getActiveTenants } from "@/lib/tenant-storage";
import type { TenantInput } from "@/types/tenant";

export async function GET() {
  const tenants = await getActiveTenants();
  return NextResponse.json({ tenants });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<TenantInput> & {
    receivedBy?: string;
  };

  const name = body.name?.trim();
  const mobile = body.mobile?.trim();
  const buildingNumber = body.buildingNumber?.trim();
  const roomNumber = body.roomNumber?.trim();
  const deposit = Number(body.deposit);
  const advance = Number(body.advance ?? 0);
  const rent = Number(body.rent);
  const rentStartFrom = body.rentStartFrom?.trim();
  const note = body.note?.trim() ?? "";
  const receivedBy = body.receivedBy?.trim() || "Admin";

  if (!name || !mobile || !buildingNumber || !roomNumber || !rentStartFrom) {
    return NextResponse.json(
      { error: "Please fill all required fields." },
      { status: 400 },
    );
  }

  if (
    Number.isNaN(deposit) ||
    Number.isNaN(rent) ||
    Number.isNaN(advance) ||
    deposit < 0 ||
    rent < 0 ||
    advance < 0
  ) {
    return NextResponse.json(
      { error: "Deposit, advance and rent must be valid numbers." },
      { status: 400 },
    );
  }

  if (advance > deposit) {
    return NextResponse.json(
      { error: "Advance cannot be greater than deposit." },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const tenant = await addTenant({
    id: crypto.randomUUID(),
    name,
    mobile,
    buildingNumber,
    roomNumber,
    deposit,
    advance,
    rent,
    rentStartFrom,
    note,
    createdAt: now,
  });

  if (advance > 0) {
    await addRentPayment({
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      type: "initial_advance",
      amount: advance,
      receivedDate: now.slice(0, 10),
      note: "Advance received at joining",
      receivedBy,
      createdAt: now,
    });
  }

  return NextResponse.json({ tenant }, { status: 201 });
}
