export type LedgerEntryType = "extra_income" | "expense";

export type LedgerEntry = {
  id: string;
  type: LedgerEntryType;
  title: string;
  amount: number;
  date: string;
  note: string;
  createdBy: string;
  createdAt: string;
};

export type LedgerEntryInput = {
  type: LedgerEntryType;
  title: string;
  amount: number;
  date: string;
  note: string;
  createdBy: string;
};

export type BalanceSheetItem = {
  id: string;
  label: string;
  amount: number;
  date: string;
  note?: string;
  source:
    | "rent"
    | "deposit"
    | "advance"
    | "extra_income"
    | "expense"
    | "carry_forward";
  by?: string;
};
