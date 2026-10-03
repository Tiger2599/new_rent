"use client";

import { FormEvent, useEffect, useState } from "react";
import { DEFAULT_ELECTRICITY_RATE, electricityCharge } from "@/lib/electricity";
import { formatRentMonth } from "@/lib/rent-utils";
import { todayInputValue } from "@/lib/format";
import type { PaymentType } from "@/types/rent";

type Tab = "pending" | "advance" | "deposit";

type RentReceiveFormProps = {
  open: boolean;
  defaultRent: number;
  pendingMonths: string[];
  pendingRemaining?: Record<string, number>;
  pendingElectricity?: Record<string, number>;
  unitsPendingMonths?: string[];
  advanceMonths: string[];
  pendingDeposit: number;
  lastElectricityUnits?: number;
  electricityRate?: number;
  submitting: boolean;
  tenantName?: string;
  onClose: () => void;
  onSubmit: (data: {
    type: PaymentType;
    rentMonths?: string[];
    amount: number;
    receivedDate: string;
    note: string;
    electricityUnits?: number;
    unitsOnly?: boolean;
    collectBoth?: boolean;
  }) => void;
};

export default function RentReceiveForm({
  open,
  defaultRent,
  pendingMonths,
  pendingRemaining = {},
  pendingElectricity = {},
  unitsPendingMonths = [],
  advanceMonths,
  pendingDeposit,
  lastElectricityUnits = 0,
  electricityRate = DEFAULT_ELECTRICITY_RATE,
  submitting,
  tenantName,
  onClose,
  onSubmit,
}: RentReceiveFormProps) {
  const [tab, setTab] = useState<Tab>("pending");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [amount, setAmount] = useState(String(defaultRent));
  const [amountTouched, setAmountTouched] = useState(false);
  const [receivedDate, setReceivedDate] = useState(todayInputValue());
  const [note, setNote] = useState("");
  const [newUnits, setNewUnits] = useState("");
  const [collectBoth, setCollectBoth] = useState(true);

  function monthAmount(month: string) {
    return pendingRemaining[month] ?? defaultRent;
  }

  function rentOnly(month: string) {
    return Math.max(0, monthAmount(month) - (pendingElectricity[month] ?? 0));
  }

  function electricityFor(months: string[]) {
    return months.reduce((sum, month) => sum + (pendingElectricity[month] ?? 0), 0);
  }

  function totalForMonths(months: string[]) {
    return months.reduce((sum, month) => sum + monthAmount(month), 0);
  }

  const nextUnits = Number(newUnits);
  const hasNewUnits =
    newUnits.trim() !== "" &&
    Number.isFinite(nextUnits) &&
    nextUnits > lastElectricityUnits;
  const extraElectricity =
    tab === "pending" && hasNewUnits
      ? electricityCharge(lastElectricityUnits, nextUnits, electricityRate)
      : 0;
  const unitsInvalid =
    tab === "pending" && newUnits.trim() !== "" && !hasNewUnits;

  useEffect(() => {
    if (!open) return;

    const preferred: Tab =
      pendingMonths.length > 0
        ? "pending"
        : pendingDeposit > 0
          ? "deposit"
          : "advance";

    setTab(preferred);
    setReceivedDate(todayInputValue());
    setNote("");
    setAmountTouched(false);
    setNewUnits("");
    setCollectBoth(true);

    if (preferred === "pending") {
      const initial = pendingMonths[0] ? [pendingMonths[0]] : [];
      setSelectedMonths(initial);
      setAmount(String(totalForMonths(initial) || defaultRent));
    } else if (preferred === "advance") {
      const initial = advanceMonths[0] ? [advanceMonths[0]] : [];
      setSelectedMonths(initial);
      setAmount(String(initial.length * defaultRent || defaultRent));
    } else {
      setSelectedMonths([]);
      setAmount(String(pendingDeposit));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset from props when form opens
  }, [open, pendingMonths, advanceMonths, pendingDeposit, defaultRent, pendingRemaining, lastElectricityUnits]);

  useEffect(() => {
    if (!open) return;

    if (tab === "pending") {
      const initial = pendingMonths[0] ? [pendingMonths[0]] : [];
      setSelectedMonths(initial);
      setAmountTouched(false);
      setAmount(String(totalForMonths(initial) || defaultRent));
    } else if (tab === "advance") {
      const initial = advanceMonths[0] ? [advanceMonths[0]] : [];
      setSelectedMonths(initial);
      setAmountTouched(false);
      setAmount(String(initial.length * defaultRent || defaultRent));
    } else {
      setSelectedMonths([]);
      setAmountTouched(false);
      setAmount(String(pendingDeposit));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, open, pendingMonths, advanceMonths, pendingDeposit, defaultRent, pendingRemaining]);

  useEffect(() => {
    if (!open || tab === "deposit" || amountTouched) return;
    if (tab === "pending") {
      const stored = collectBoth ? 0 : electricityFor(selectedMonths);
      const added = collectBoth ? extraElectricity : 0;
      const base = Math.max(0, totalForMonths(selectedMonths) - stored);
      setAmount(String(base + added));
      return;
    }
    setAmount(String(selectedMonths.length * defaultRent || defaultRent));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonths, defaultRent, open, tab, amountTouched, pendingRemaining, pendingElectricity, extraElectricity, collectBoth]);

  if (!open) return null;

  const months = tab === "pending" ? pendingMonths : advanceMonths;

  function toggleMonth(month: string) {
    setSelectedMonths((prev) =>
      prev.includes(month)
        ? prev.filter((m) => m !== month)
        : [...prev, month].sort(),
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (tab === "deposit") {
      onSubmit({
        type: "deposit",
        amount: Number(amount),
        receivedDate,
        note,
      });
      return;
    }

    onSubmit({
      type: tab === "advance" ? "advance" : "rent",
      rentMonths: selectedMonths,
      amount: Number(amount),
      receivedDate,
      note,
      ...(tab === "pending"
        ? {
            collectBoth,
            ...(hasNewUnits ? { electricityUnits: nextUnits } : {}),
          }
        : {}),
    });
  }

  function saveUnitsOnly() {
    if (selectedMonths.length !== 1 || !hasNewUnits) return;
    onSubmit({
      type: "rent",
      rentMonths: selectedMonths,
      amount: 0,
      receivedDate,
      note,
      electricityUnits: nextUnits,
      unitsOnly: true,
    });
  }

  const canSubmit =
    tab === "deposit"
      ? pendingDeposit > 0 && Number(amount) > 0
      : months.length > 0 &&
        selectedMonths.length > 0 &&
        Number(amount) > 0 &&
        !unitsInvalid;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close form"
        className="absolute inset-0"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl"
      >
        <h3 className="text-base font-semibold text-gray-900">Receive Payment</h3>
        <p className="mt-1 text-sm text-gray-500">
          {tenantName
            ? `${tenantName} – record rent, advance or pending deposit`
            : "Record rent, advance or pending deposit"}
        </p>

        <div className="mt-4 flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          {(
            [
              ["pending", "Pending Rent"],
              ["advance", "Advance Rent"],
              ["deposit", "Pending Deposit"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex-1 rounded-md px-2 py-2 text-[11px] font-medium transition sm:text-xs ${
                tab === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {tab !== "deposit" && (
            <>
              {months.length === 0 ? (
                <p className="text-sm text-red-600">
                  {tab === "pending"
                    ? "No pending rent months available."
                    : "No advance months available."}
                </p>
              ) : (
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    {tab === "pending"
                      ? "Select Pending Months *"
                      : "Select Advance Months *"}
                  </span>
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
                    {months.map((month) => {
                      const checked = selectedMonths.includes(month);
                      const remaining =
                        tab === "pending" ? monthAmount(month) : defaultRent;
                      return (
                        <label
                          key={month}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-white"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMonth(month)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="flex-1">{formatRentMonth(month)}</span>
                          {tab === "pending" && pendingElectricity[month] > 0 && (
                            <span className="text-xs text-amber-700">
                              + units {pendingElectricity[month]}
                            </span>
                          )}
                          {tab === "pending" &&
                            unitsPendingMonths.includes(month) &&
                            !(pendingElectricity[month] > 0) && (
                              <span className="text-xs text-amber-700">Units pending</span>
                            )}
                          {tab === "pending" && remaining < defaultRent && remaining > 0 && (
                            <span className="text-xs text-amber-700">
                              Due {remaining}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">
                    {selectedMonths.length} month
                    {selectedMonths.length === 1 ? "" : "s"} selected
                  </p>
                </div>
              )}
            </>
          )}

          {tab === "pending" && months.length > 0 && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Electricity units
              </span>
              <input
                type="number"
                min={lastElectricityUnits + 1}
                step="1"
                value={newUnits}
                onChange={(e) => setNewUnits(e.target.value)}
                placeholder={`Last: ${lastElectricityUnits}`}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
              />
              <p className="mt-1 text-xs text-gray-500">
                Last units: {lastElectricityUnits}. New value must be greater.
              </p>
              {unitsInvalid && (
                <p className="mt-1 text-xs text-red-600">
                  Units must be greater than {lastElectricityUnits}.
                </p>
              )}
              {hasNewUnits && (
                <p className="mt-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Difference {nextUnits - lastElectricityUnits} × {electricityRate} ={" "}
                  <span className="font-semibold">{extraElectricity}</span>
                  {collectBoth
                    ? " added with rent"
                    : " saved on this month. Rent total will include it later."}
                </p>
              )}
              {electricityFor(selectedMonths) > 0 && (
                <p className="mt-1.5 text-xs text-amber-800">
                  Saved units on selected months: {electricityFor(selectedMonths)}
                  {collectBoth ? ". This will be received with rent." : ". Left pending."}
                </p>
              )}
            </label>
          )}

          {tab === "pending" && months.length > 0 && (
            <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={collectBoth}
                onChange={(e) => {
                  setAmountTouched(false);
                  setCollectBoth(e.target.checked);
                }}
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
              />
              <span>
                Receive rent and units together
                <span className="mt-0.5 block text-xs text-gray-500">
                  If this is off, the month stays pending until both rent and units are received.
                </span>
              </span>
            </label>
          )}

          {tab === "deposit" && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Pending deposit:{" "}
              <span className="font-semibold text-gray-900">
                {pendingDeposit}
              </span>
            </p>
          )}

          {(tab === "deposit" ? pendingDeposit > 0 : months.length > 0) && (
            <>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Amount *
                </span>
                <input
                  required
                  type="number"
                  min="1"
                  max={tab === "deposit" ? pendingDeposit : undefined}
                  value={amount}
                  onChange={(e) => {
                    setAmountTouched(true);
                    setAmount(e.target.value);
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
                />
                {tab === "pending" && selectedMonths.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Rent {selectedMonths.reduce((sum, month) => sum + rentOnly(month), 0)}
                    {collectBoth && electricityFor(selectedMonths) > 0
                      ? ` + saved units ${electricityFor(selectedMonths)}`
                      : ""}
                    {collectBoth && extraElectricity > 0
                      ? ` + new units ${extraElectricity}`
                      : ""}
                  </p>
                )}
                {tab === "advance" && selectedMonths.length > 1 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Auto total = {selectedMonths.length} × {defaultRent}
                  </p>
                )}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Received Date *
                </span>
                <input
                  required
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Note
                </span>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
                />
              </label>
            </>
          )}

          {tab === "deposit" && pendingDeposit <= 0 && (
            <p className="text-sm text-red-600">No pending deposit remaining.</p>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {tab === "pending" && (
            <>
            <button
              type="button"
              disabled={
                submitting ||
                selectedMonths.length !== 1 ||
                !hasNewUnits ||
                unitsInvalid
              }
              onClick={saveUnitsOnly}
              className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save units only"}
            </button>
            <p className="text-center text-[11px] text-gray-500">
              Select one month and enter units. Rent is not received. The unit amount is added to that month and collected later with rent.
            </p>
            </>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
