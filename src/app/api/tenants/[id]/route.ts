import { NextResponse } from "next/server";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import {
  getTenantById,
  removeTenant,
  updateTenant,
} from "@/lib/tenant-storage";
import {
  normalizeTenantProofs,
  type TenantInput,
  type TenantProof,
} from "@/types/tenant";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const tenant = await getTenantById(id);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  return NextResponse.json({ tenant });
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const existing = await getTenantById(id);

  if (!existing) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  if (existing.removedAt) {
    return NextResponse.json(
      { error: "Cannot edit removed tenant." },
      { status: 400 },
    );
  }

  const body = (await request.json()) as Partial<TenantInput>;

  const name = body.name?.trim();
  const mobile = body.mobile?.trim();
  const buildingNumber = body.buildingNumber?.trim();
  const roomNumber = body.roomNumber?.trim();
  const deposit = Number(body.deposit);
  const advance = Number(body.advance ?? existing.advance ?? 0);
  const rent = Number(body.rent);
  const rentStartFrom = body.rentStartFrom?.trim();
  const note = body.note?.trim() ?? "";
  const proofs = parseProofs(body.proofs);

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

  const oldProofs = normalizeTenantProofs(existing);
  const nextIds = new Set(proofs.map((p) => p.publicId).filter(Boolean));
  for (const old of oldProofs) {
    if (old.publicId && !nextIds.has(old.publicId)) {
      await deleteCloudinaryImage(old.publicId);
    }
  }

  const tenant = await updateTenant(id, {
    name,
    mobile,
    buildingNumber,
    roomNumber,
    deposit,
    advance,
    rent,
    rentStartFrom,
    note,
    proofs,
  });

  return NextResponse.json({ tenant });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const removed = await removeTenant(id);

  if (!removed) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  return NextResponse.json({ tenant: removed });
}
