import { NextResponse } from "next/server";
import { deleteRentPayment } from "@/lib/rent-storage";
import { getTenantById, updateTenant } from "@/lib/tenant-storage";

type RouteContext = {
  params: Promise<{ id: string; paymentId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, paymentId } = await context.params;
  const tenant = await getTenantById(id);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  const deleted = await deleteRentPayment(paymentId);

  if (!deleted || deleted.tenantId !== id) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  if (deleted.type === "initial_advance") {
    const nextAdvance = Math.max(0, (tenant.advance ?? 0) - deleted.amount);
    await updateTenant(id, { advance: nextAdvance });
  }

  return NextResponse.json({ payment: deleted });
}
