import {
  collections,
  getDb,
  noId,
  tenantListProjection,
  tenantNameProjection,
} from "@/lib/mongodb";
import type { Tenant } from "@/types/tenant";
import { normalizeTenantProofs } from "@/types/tenant";

function withNormalizedProofs(tenant: Tenant | null): Tenant | null {
  if (!tenant) return null;
  return {
    ...tenant,
    electricityUnits: tenant.electricityUnits ?? 0,
    proofs: normalizeTenantProofs(tenant),
  };
}

export async function getActiveTenants(ownerId: string): Promise<Tenant[]> {
  const db = await getDb();
  const tenants = await db
    .collection<Tenant>(collections.tenants)
    .find({ ownerId, removedAt: { $exists: false } }, tenantListProjection)
    .sort({ createdAt: -1 })
    .toArray();

  return tenants.map((t) => withNormalizedProofs(t)!);
}

export async function getOldTenants(ownerId: string): Promise<Tenant[]> {
  const db = await getDb();
  const tenants = await db
    .collection<Tenant>(collections.tenants)
    .find({ ownerId, removedAt: { $exists: true } }, tenantListProjection)
    .sort({ removedAt: -1 })
    .toArray();

  return tenants.map((t) => withNormalizedProofs(t)!);
}

export async function getTenantNameMap(
  ownerId: string,
): Promise<Map<string, string>> {
  const db = await getDb();
  const rows = await db
    .collection<{ id: string; name: string }>(collections.tenants)
    .find({ ownerId }, tenantNameProjection)
    .toArray();

  return new Map(rows.map((t) => [t.id, t.name]));
}

export async function searchTenants(
  ownerId: string,
  query: string,
  limit = 12,
): Promise<Tenant[]> {
  const q = query.trim();
  if (!q) return [];

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = { $regex: escaped, $options: "i" as const };

  const db = await getDb();
  const tenants = await db
    .collection<Tenant>(collections.tenants)
    .find(
      {
        ownerId,
        $or: [
          { name: regex },
          { mobile: regex },
          { buildingNumber: regex },
          { roomNumber: regex },
        ],
      },
      {
        projection: {
          _id: 0,
          id: 1,
          ownerId: 1,
          name: 1,
          mobile: 1,
          buildingNumber: 1,
          roomNumber: 1,
          rent: 1,
          removedAt: 1,
        },
      },
    )
    .sort({ name: 1 })
    .limit(limit)
    .toArray();

  return tenants;
}

export async function getTenantById(
  id: string,
  ownerId: string,
): Promise<Tenant | null> {
  const db = await getDb();
  const tenant = await db
    .collection<Tenant>(collections.tenants)
    .findOne({ id, ownerId }, noId);
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
  ownerId: string,
  patch: Partial<Omit<Tenant, "id" | "createdAt" | "ownerId">>,
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

  const result = await col.findOneAndUpdate(
    { id, ownerId },
    update,
    { returnDocument: "after", projection: noId.projection },
  );

  return withNormalizedProofs(result);
}

export async function removeTenant(
  id: string,
  ownerId: string,
): Promise<Tenant | null> {
  const db = await getDb();
  const tenants = db.collection<Tenant>(collections.tenants);
  const removedAt = new Date().toISOString();

  const result = await tenants.findOneAndUpdate(
    { id, ownerId, removedAt: { $exists: false } },
    { $set: { removedAt } },
    { returnDocument: "after", projection: noId.projection },
  );

  return withNormalizedProofs(result);
}
