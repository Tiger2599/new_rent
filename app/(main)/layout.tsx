import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sidebar } from '@/components/Sidebar';
import { GlobalSearch } from '@/components/GlobalSearch';
import { LogoutButton } from '@/components/LogoutButton';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <GlobalSearch />
            </div>
            <LogoutButton />
          </header>
          <div className="flex-1 p-6 overflow-auto">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
