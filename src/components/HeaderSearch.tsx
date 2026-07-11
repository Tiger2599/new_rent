"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/format";

type SearchTenant = {
  id: string;
  name: string;
  mobile: string;
  buildingNumber: string;
  roomNumber: string;
  rent: number;
  removedAt?: string;
};

export default function HeaderSearch() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchTenant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onClickOutside(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/tenants/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setLoading(false);
      if (res.ok) {
        setResults(data.tenants ?? []);
      } else {
        setResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, open]);

  function goToTenant(id: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/tenants/${id}`);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Search tenants"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-4.35-4.35m1.6-5.4a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-[min(86vw,320px)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 p-2">
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tenant name..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:bg-white"
            />
          </div>

          <div className="max-h-72 overflow-y-auto">
            {query.trim().length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-gray-400">
                Type a tenant name
              </p>
            ) : loading ? (
              <p className="px-3 py-4 text-center text-xs text-gray-400">
                Searching...
              </p>
            ) : results.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-gray-400">
                No tenants found
              </p>
            ) : (
              <ul>
                {results.map((tenant) => (
                  <li key={tenant.id}>
                    <button
                      type="button"
                      onClick={() => goToTenant(tenant.id)}
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-gray-50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        {tenant.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {tenant.name}
                          {tenant.removedAt && (
                            <span className="ml-1 text-[10px] font-normal text-gray-400">
                              (Old)
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {tenant.mobile} · B{tenant.buildingNumber}/R
                          {tenant.roomNumber}
                        </p>
                        <p className="text-xs text-gray-400">
                          Rent {formatCurrency(tenant.rent)}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
