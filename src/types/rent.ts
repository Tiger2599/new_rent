export type PaymentType = "rent" | "advance" | "deposit" | "initial_advance";

export type RentPayment = {
  id: string;
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
};

export type RentPaymentInput = {
  type: PaymentType;
  rentMonth?: string;
  rentMonths?: string[];
  amount: number;
  receivedDate: string;
  note: string;
  receivedBy: string;
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
};
