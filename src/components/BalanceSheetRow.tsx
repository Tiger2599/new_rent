"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import type { BalanceSheetItem } from "@/types/ledger";

function dayFromDate(date: string): string {
  const day = new Date(date).getDate();
  return Number.isNaN(day) ? "-" : String(day);
}

export default function BalanceSheetRow({
  item,
  tone,
}: {
  item: BalanceSheetItem;
  tone: "income" | "expense";
}) {
  const [open, setOpen] = useState(false);
  const amountClass =
    tone === "income" ? "text-green-700" : "text-red-700";

  const tooltip = [
    item.label,
    `Date: ${formatDate(item.date)}`,
    item.by ? `By: ${item.by}` : null,
    item.note ? `Note: ${item.note}` : null,
    `Type: ${item.source.replace(/_/g, " ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <li className="relative border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        title={tooltip}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="grid w-full grid-cols-[68px_28px_minmax(0,1fr)] items-center text-left hover:bg-gray-50/80"
      >
        <span
          className={`border-r border-gray-100 px-1.5 py-2 text-[11px] font-semibold tabular-nums ${amountClass}`}
        >
          {formatCurrency(item.amount)}
        </span>
        <span className="border-r border-gray-100 px-1 py-2 text-center text-[11px] font-medium text-gray-400">
          {dayFromDate(item.date)}
        </span>
        <span className="min-w-0 truncate px-1.5 py-2 text-[11px] text-gray-600">
          {item.label}
        </span>
      </button>

      {open && (
        <div className="absolute left-1 right-1 top-full z-20 mt-1 whitespace-pre-line rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] leading-relaxed text-gray-700 shadow-lg">
          {tooltip}
        </div>
      )}
    </li>
  );
}
