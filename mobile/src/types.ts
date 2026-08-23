export type User = {
  id: number;
  email: string;
  name: string;
  role: "owner" | "admin";
  ownerId: string;
};

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
  electricityUnits?: number;
  note: string;
  createdAt: string;
  removedAt?: string;
};

export type RentPayment = {
  id: string;
  tenantId: string;
  type: string;
  rentMonths?: string[];
  rentMonth?: string;
  amount: number;
  receivedDate: string;
  note: string;
  receivedBy: string;
  previousElectricityUnits?: number;
  electricityUnits?: number;
  electricityCharge?: number;
};

export type PendingRentRow = {
  id: string;
  tenantId: string;
  tenantName: string;
  buildingNumber: string;
  roomNumber: string;
  amount: number;
  monthlyRent: number;
  rentMonths: string[];
  monthsLabel: string;
};

export type BalanceSheetItem = {
  id: string;
  label: string;
  amount: number;
  date: string;
  note?: string;
  electricityUnits?: number;
  electricityCharge?: number;
};

export type TeamUser = {
  id: number;
  email: string;
  name: string;
  role: "owner" | "admin";
  createdAt?: string;
};
