import { NextResponse } from "next/server";
import { deleteRentPayment } from "@/lib/rent-storage";
import { lastElectricityUnits } from "@/lib/electricity";
import { requireSession } from "@/lib/session";
import { getTenantById, updateTenant } from "@/lib/tenant-storage";

type RouteContext = {
  params: Promise<{ id: string; paymentId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const { id, paymentId } = await context.params;
  const tenant = await getTenantById(id, session.ownerId);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  const deleted = await deleteRentPayment(paymentId, session.ownerId);

  if (!deleted || deleted.tenantId !== id) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  if (deleted.type === "initial_advance") {
    const nextAdvance = Math.max(0, (tenant.advance ?? 0) - deleted.amount);
    await updateTenant(id, session.ownerId, { advance: nextAdvance });
  }

  if (
    deleted.electricityUnits !== undefined &&
    lastElectricityUnits(tenant.electricityUnits) === deleted.electricityUnits
  ) {
    await updateTenant(id, session.ownerId, {
      electricityUnits: deleted.previousElectricityUnits ?? 0,
    });
  }

  return NextResponse.json({ payment: deleted });
}
