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
    proofs: normalizeTenantProofs(tenant),
  };
}

export async function getActiveTenants(): Promise<Tenant[]> {
  const db = await getDb();
  const tenants = await db
    .collection<Tenant>(collections.tenants)
    .find({ removedAt: { $exists: false } }, tenantListProjection)
    .sort({ createdAt: -1 })
    .toArray();

  return tenants.map((t) => withNormalizedProofs(t)!);
}

export async function getOldTenants(): Promise<Tenant[]> {
  const db = await getDb();
  const tenants = await db
    .collection<Tenant>(collections.tenants)
    .find({ removedAt: { $exists: true } }, tenantListProjection)
    .sort({ removedAt: -1 })
    .toArray();

  return tenants.map((t) => withNormalizedProofs(t)!);
}

/** id → name map for balance sheet (avoids loading full tenant docs) */
export async function getTenantNameMap(): Promise<Map<string, string>> {
  const db = await getDb();
  const rows = await db
    .collection<{ id: string; name: string }>(collections.tenants)
    .find({}, tenantNameProjection)
    .toArray();

  return new Map(rows.map((t) => [t.id, t.name]));
}

export async function searchTenants(query: string, limit = 12): Promise<Tenant[]> {
  const q = query.trim();
  if (!q) return [];

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = { $regex: escaped, $options: "i" as const };

  const db = await getDb();
  const tenants = await db
    .collection<Tenant>(collections.tenants)
    .find(
      {
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

  const result = await col.findOneAndUpdate(
    { id },
    update,
    { returnDocument: "after", projection: noId.projection },
  );

  return withNormalizedProofs(result);
}

export async function removeTenant(id: string): Promise<Tenant | null> {
  const db = await getDb();
  const tenants = db.collection<Tenant>(collections.tenants);
  const removedAt = new Date().toISOString();

  const result = await tenants.findOneAndUpdate(
    { id, removedAt: { $exists: false } },
    { $set: { removedAt } },
    { returnDocument: "after", projection: noId.projection },
  );

  return withNormalizedProofs(result);
}
