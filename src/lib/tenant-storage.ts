import { collections, getDb, noId } from "@/lib/mongodb";
import type { Tenant } from "@/types/tenant";
import { normalizeTenantProofs } from "@/types/tenant";

function withNormalizedProofs(tenant: Tenant | null): Tenant | null {
  if (!tenant) return null;
  return {
    ...tenant,
    proofs: normalizeTenantProofs(tenant),
  };
}

export async function getActiveTenants(): Promise<Tenant[]> {
  const db = await getDb();
  const tenants = await db
    .collection<Tenant>(collections.tenants)
    .find({ removedAt: { $exists: false } }, noId)
    .sort({ createdAt: -1 })
    .toArray();

  return tenants.map((t) => withNormalizedProofs(t)!);
}

export async function getOldTenants(): Promise<Tenant[]> {
  const db = await getDb();
  const tenants = await db
    .collection<Tenant>(collections.tenants)
    .find({ removedAt: { $exists: true } }, noId)
    .sort({ removedAt: -1 })
    .toArray();

  return tenants.map((t) => withNormalizedProofs(t)!);
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const db = await getDb();
  const tenant = await db
    .collection<Tenant>(collections.tenants)
    .findOne({ id }, noId);
  return withNormalizedProofs(tenant);
}

export async function addTenant(tenant: Tenant): Promise<Tenant> {
  const db = await getDb();
  const payload: Tenant = {
    ...tenant,
    proofs: tenant.proofs ?? [],
  };
  await db.collection(collections.tenants).insertOne(payload);
  return payload;
}

export async function updateTenant(
  id: string,
  patch: Partial<Omit<Tenant, "id" | "createdAt">>,
): Promise<Tenant | null> {
  const db = await getDb();
  const col = db.collection<Tenant>(collections.tenants);

  const setDoc: Record<string, unknown> = { ...patch };
  const unsetDoc: Record<string, ""> = {
    proofUrl: "",
    proofPublicId: "",
  };

  if (patch.proofs) {
    setDoc.proofs = patch.proofs;
  }

  const update: Record<string, unknown> = {
    $unset: unsetDoc,
  };
  if (Object.keys(setDoc).length > 0) update.$set = setDoc;

  await col.updateOne({ id }, update);
  return getTenantById(id);
}

export async function removeTenant(id: string): Promise<Tenant | null> {
  const db = await getDb();
  const tenants = db.collection<Tenant>(collections.tenants);
  const existing = await tenants.findOne(
    { id, removedAt: { $exists: false } },
    noId,
  );

  if (!existing) return null;

  const removedAt = new Date().toISOString();
  await tenants.updateOne({ id }, { $set: { removedAt } });

  return withNormalizedProofs({ ...existing, removedAt });
}
