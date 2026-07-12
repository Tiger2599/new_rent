"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatDateRangeLabel,
  toDateKey,
} from "@/lib/month-utils";

type DateRange = {
  from: string;
  to: string;
};

type DateRangePickerProps = {
  from: string;
  to: string;
  onChange: (range: DateRange) => void;
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addMonths(base: Date, delta: number): Date {
  return new Date(base.getFullYear(), base.getMonth() + delta, 1);
}

function monthTitle(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function buildCalendarDays(view: Date): Date[] {
  const year = view.getFullYear();
  const month = view.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    return day;
  });
}

export default function DateRangePicker({
  from,
  to,
  onChange,
}: DateRangePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => parseDateKey(from));
  const [draftStart, setDraftStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setViewMonth(parseDateKey(from));
    setDraftStart(null);
    setHoverDate(null);
  }, [open, from]);

  const previewFrom = draftStart ?? from;
  const previewTo = draftStart ? (hoverDate ?? draftStart) : to;
  const rangeStart =
    previewFrom <= previewTo ? previewFrom : previewTo;
  const rangeEnd =
    previewFrom <= previewTo ? previewTo : previewFrom;

  function handleDayClick(dayKey: string) {
    if (!draftStart) {
      setDraftStart(dayKey);
      setHoverDate(dayKey);
      return;
    }

    const nextFrom = draftStart <= dayKey ? draftStart : dayKey;
    const nextTo = draftStart <= dayKey ? dayKey : draftStart;
    onChange({ from: nextFrom, to: nextTo });
    setDraftStart(null);
    setHoverDate(null);
    setOpen(false);
    triggerRef.current?.focus();
  }

  const days = buildCalendarDays(viewMonth);
  const todayKey = toDateKey(new Date());
  const viewMonthIndex = viewMonth.getMonth();

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-800 outline-none transition hover:border-gray-300 focus:border-gray-400"
      >
        <span>{formatDateRangeLabel(from, to)}</span>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="h-3.5 w-3.5 text-gray-500"
        >
          <path
            d="M4.5 2.5v1.25M11.5 2.5v1.25M2.75 5.75h10.5M3.5 3.75h9A.75.75 0 0 1 13.25 4.5v8a.75.75 0 0 1-.75.75h-9a.75.75 0 0 1-.75-.75v-8a.75.75 0 0 1 .75-.75Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close calendar"
            className="fixed inset-0 z-30 cursor-default bg-transparent"
            onClick={() => {
              setOpen(false);
              setDraftStart(null);
              setHoverDate(null);
            }}
          />
          <div
            role="dialog"
            aria-label="Select date range"
            className="absolute right-0 z-40 mt-2 w-[280px] rounded-2xl border border-gray-200 bg-white p-3 shadow-lg"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path
                    d="M10 3.5 5.5 8 10 12.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <p className="text-sm font-semibold text-gray-900">
                {monthTitle(viewMonth)}
              </p>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path
                    d="M6 3.5 10.5 8 6 12.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-gray-500">
              {WEEKDAYS.map((day, index) => (
                <span
                  key={`${day}-${index}`}
                  className={`py-1 ${index === 1 ? "text-blue-500" : ""}`}
                >
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {days.map((day) => {
                const dayKey = toDateKey(day);
                const inCurrentMonth = day.getMonth() === viewMonthIndex;
                const isStart = dayKey === rangeStart;
                const isEnd = dayKey === rangeEnd;
                const inRange =
                  dayKey > rangeStart && dayKey < rangeEnd;
                const isEndpoint = isStart || isEnd;
                const isToday = dayKey === todayKey;
                const isSingle = rangeStart === rangeEnd;

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => handleDayClick(dayKey)}
                    onMouseEnter={() => {
                      if (draftStart) setHoverDate(dayKey);
                    }}
                    className={`relative flex h-9 items-center justify-center text-sm transition ${
                      inRange ? "bg-blue-50" : ""
                    } ${
                      isStart && !isSingle
                        ? "rounded-l-full bg-blue-50"
                        : ""
                    } ${
                      isEnd && !isSingle
                        ? "rounded-r-full bg-blue-50"
                        : ""
                    }`}
                  >
                    <span
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${
                        isEndpoint
                          ? "bg-blue-500 font-semibold text-white"
                          : inCurrentMonth
                            ? "text-gray-800 hover:bg-gray-100"
                            : "text-gray-300 hover:bg-gray-50"
                      } ${
                        isToday && !isEndpoint
                          ? "ring-1 ring-blue-300"
                          : ""
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-2 px-1 text-[11px] text-gray-400">
              {draftStart
                ? "Select end date"
                : "Select start and end dates"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
