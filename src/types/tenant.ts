export type TenantProof = {
  url: string;
  publicId: string;
};

export type Tenant = {
  id: string;
  ownerId: string;
  name: string;
  mobile: string;
  buildingNumber: string;
  roomNumber: string;
  deposit: number;
  advance: number;
  rent: number;
  rentStartFrom: string;
  /** Last recorded meter reading. Defaults to 0. */
  electricityUnits: number;
  note: string;
  proofs?: TenantProof[];
  /** @deprecated use proofs */
  proofUrl?: string;
  /** @deprecated use proofs */
  proofPublicId?: string;
  createdAt: string;
  removedAt?: string;
};

export type TenantInput = {
  name: string;
  mobile: string;
  buildingNumber: string;
  roomNumber: string;
  deposit: number;
  advance: number;
  rent: number;
  rentStartFrom: string;
  electricityUnits?: number;
  note: string;
  proofs?: TenantProof[];
};

export function normalizeTenantProofs(tenant: Tenant): TenantProof[] {
  if (tenant.proofs && tenant.proofs.length > 0) {
    return tenant.proofs.filter((p) => p?.url);
  }

  if (tenant.proofUrl) {
    return [
      {
        url: tenant.proofUrl,
        publicId: tenant.proofPublicId ?? "",
      },
    ];
  }

  return [];
}
