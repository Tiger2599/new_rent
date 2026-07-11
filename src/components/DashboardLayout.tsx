"use client";

import { useState } from "react";
import BackButton from "@/components/BackButton";
import HeaderSearch from "@/components/HeaderSearch";
import MobileContainer from "@/components/MobileContainer";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
  title,
  showBack = true,
  backHref,
}: {
  children: React.ReactNode;
  title: string;
  showBack?: boolean;
  backHref?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <MobileContainer>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center text-base font-semibold text-gray-800">
          {title}
        </h1>
        <HeaderSearch />
      </header>

      <main className="flex-1 px-4 py-5">
        {showBack && <BackButton href={backHref} />}
        {children}
      </main>
    </MobileContainer>
  );
}
