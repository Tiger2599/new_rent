export type Tenant = {
  id: string;
  name: string;
  mobile: string;
  buildingNumber: string;
  roomNumber: string;
  deposit: number;
  advance: number;
  rent: number;
  rentStartFrom: string;
  note: string;
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
  note: string;
};
