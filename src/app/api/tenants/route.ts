import { NextResponse } from "next/server";
import { addRentPayment } from "@/lib/rent-storage";
import { addTenant, getActiveTenants } from "@/lib/tenant-storage";
import { requireSession } from "@/lib/session";
import { parseElectricityUnits } from "@/lib/electricity";
import type { TenantInput, TenantProof } from "@/types/tenant";

function parseProofs(input: unknown): TenantProof[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const url = String((item as TenantProof).url ?? "").trim();
      const publicId = String((item as TenantProof).publicId ?? "").trim();
      if (!url) return null;
      return { url, publicId };
    })
    .filter(Boolean) as TenantProof[];
}

export async function GET(request: Request) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const tenants = await getActiveTenants(session.ownerId);
  return NextResponse.json({ tenants });
}

export async function POST(request: Request) {
  const { session, error } = await requireSession(request);
  if (error) return error;

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
  const proofs = parseProofs(body.proofs);
  const receivedBy = body.receivedBy?.trim() || session.name || "Admin";
  const electricity = parseElectricityUnits(body.electricityUnits, 0);
  if (electricity.error) {
    return NextResponse.json({ error: electricity.error }, { status: 400 });
  }

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
    ownerId: session.ownerId,
    name,
    mobile,
    buildingNumber,
    roomNumber,
    deposit,
    advance,
    rent,
    rentStartFrom,
    electricityUnits: electricity.units,
    note,
    proofs,
    createdAt: now,
  });

  if (advance > 0) {
    await addRentPayment({
      id: crypto.randomUUID(),
      ownerId: session.ownerId,
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
