'use client';

import Link from 'next/link';

export function LogoutButton() {
  function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }

  return (
    <Link
      href="/login"
      className="text-sm text-slate-400 hover:text-white"
      onClick={handleLogout}
    >
      Logout
    </Link>
  );
}
