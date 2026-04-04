'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { GlobalSearch } from './GlobalSearch';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/properties', label: 'Properties', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { href: '/flats', label: 'Flats', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/tenants', label: 'Tenants', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { href: '/rent', label: 'Rent Payments', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/collection-report', label: 'Collection Report', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2h-3m-4 0z' },
  { href: '/financial-overview', label: 'Financial Overview', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/other-income', label: 'Other Income', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 18v-6m0 0l-3 3m3-3l3 3M12 6V4m0 2H9m3 0h3' },
  { href: '/notes', label: 'Maintenance', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/users', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const can = (perm: string) => {
    if (user?.role === 'owner') return true;
    return user?.permissions?.[perm as keyof typeof user.permissions] === true;
  };
  const filteredNav = nav.filter((item) => {
    if (item.href === '/users') return can('users');
    if (item.href === '/financial-overview') return can('expenses') || can('balanceSheet');
    if (item.href === '/other-income') return can('expenses') || can('balanceSheet');
    if (item.href === '/collection-report') return can('rent') || can('payments');
    if (item.href === '/rent') return can('rent') || can('payments');
    return true;
  });

  function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  return (
    <div className="flex min-h-screen bg-surface items-start">
      <div
        className="fixed inset-0 z-40 bg-ink/10 backdrop-blur-sm lg:hidden"
        aria-hidden={!sidebarOpen}
        onClick={() => setSidebarOpen(false)}
        style={{ display: sidebarOpen ? 'block' : 'none' }}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 min-h-screen bg-surface-card flex flex-col transform transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:self-start lg:h-screen lg:max-h-screen lg:overflow-y-auto lg:shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ boxShadow: '4px 0 24px -4px rgba(0,0,0,0.06)' }}
      >
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-blue flex items-center justify-center text-primary-600 font-bold text-sm shadow-soft">T</span>
            <span className="text-lg font-semibold text-ink">Tenant Manager</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2.5 rounded-input hover:bg-slate-50 text-ink"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {filteredNav.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-input text-sm font-medium transition-all min-h-[44px] ${
                  active
                    ? 'bg-gradient-to-r from-primary-soft/40 to-primary-sky/30 text-primary-600'
                    : 'text-ink-muted hover:bg-slate-50/80 hover:text-ink'
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
          <p className="text-xs font-medium text-ink truncate px-3">{user?.name}</p>
          <p className="text-xs text-ink-muted truncate px-3 capitalize">{user?.role}</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-14 sm:h-16 bg-surface-card/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 gap-4" style={{ boxShadow: '0 2px 20px -4px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-input hover:bg-slate-50 text-ink flex-shrink-0"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex-1 min-w-0 max-w-md">
              <GlobalSearch />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link href="/rent" className="p-2.5 rounded-input hover:bg-slate-50 text-ink-muted hover:text-ink transition" aria-label="Notifications">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </Link>
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 p-2 sm:px-3 sm:py-2.5 rounded-input hover:bg-slate-50 text-ink min-h-[44px] transition"
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <span className="w-9 h-9 rounded-xl bg-gradient-blue flex items-center justify-center text-primary-600 font-semibold text-sm shadow-soft">
                  {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </span>
                <span className="hidden sm:block text-sm font-medium text-ink truncate max-w-[120px]">{user?.name}</span>
                <svg className={`w-4 h-4 text-ink-muted transition ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-card bg-surface-card py-2 z-50 shadow-soft-lg">
                  <div className="px-4 py-3 border-b border-slate-100/80">
                    <p className="text-sm font-semibold text-ink truncate">{user?.name}</p>
                    <p className="text-xs text-ink-muted truncate">{user?.email}</p>
                  </div>
                  <Link href="/dashboard" className="block px-4 py-2.5 text-sm text-ink hover:bg-slate-50/80 rounded-lg mx-2">Dashboard</Link>
                  <Link href="/users" className="block px-4 py-2.5 text-sm text-ink hover:bg-slate-50/80 rounded-lg mx-2">Settings</Link>
                  <button type="button" onClick={logout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/80 rounded-lg mx-2">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
