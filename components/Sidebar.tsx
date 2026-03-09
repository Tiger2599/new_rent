'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/providers';

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/properties', label: 'Properties' },
  { href: '/flats', label: 'Flats' },
  { href: '/tenants', label: 'Tenants' },
  { href: '/rent', label: 'Rent Management' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/balance-sheet', label: 'Balance Sheet' },
  { href: '/notes', label: 'Notes' },
  { href: '/users', label: 'Users' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const can = (perm: string) => {
    if (user?.role === 'owner') return true;
    return user?.permissions?.[perm as keyof typeof user.permissions] === true;
  };

  const filteredNav = nav.filter((item) => {
    if (item.href === '/users') return can('users');
    if (item.href === '/expenses' || item.href === '/balance-sheet') return can('expenses') || can('balanceSheet');
    if (item.href === '/rent') return can('rent') || can('payments');
    return true;
  });

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <Link href="/dashboard" className="text-lg font-semibold text-white">
          Tenant Manager
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {filteredNav.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-700">
        <p className="text-xs text-slate-500 truncate px-3" title={user?.email}>
          {user?.name} ({user?.role})
        </p>
      </div>
    </aside>
  );
}
