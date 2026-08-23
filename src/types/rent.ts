export type PaymentType = "rent" | "advance" | "deposit" | "initial_advance";

export type RentPayment = {
  id: string;
  ownerId: string;
  tenantId: string;
  type: PaymentType;
  /** @deprecated Prefer rentMonths; kept for legacy rows / indexes */
  rentMonth?: string;
  rentMonths?: string[];
  amount: number;
  receivedDate: string;
  note: string;
  receivedBy: string;
  createdAt: string;
  previousElectricityUnits?: number;
  electricityUnits?: number;
  electricityCharge?: number;
};

export type RentPaymentInput = {
  type: PaymentType;
  rentMonth?: string;
  rentMonths?: string[];
  amount: number;
  receivedDate: string;
  note: string;
  receivedBy: string;
  electricityUnits?: number;
};

export type GroupedRentPayment = {
  id: string;
  ids: string[];
  tenantId: string;
  type: PaymentType;
  rentMonths: string[];
  amount: number;
  receivedDate: string;
  note: string;
  receivedBy: string;
  createdAt: string;
  previousElectricityUnits?: number;
  electricityUnits?: number;
  electricityCharge?: number;
};
