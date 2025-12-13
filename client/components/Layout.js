import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getAuth, clearAuth } from '../lib/auth';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Layout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    const { user: authUser } = getAuth();
    if (!authUser) {
      router.push('/login');
      return;
    }
    setUser(authUser);

    // Check subscription status
    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        if (!data.user.hasActiveSubscription && !data.user.isTrialActive) {
          setTrialExpired(true);
        }
      })
      .catch(() => {
        clearAuth();
        router.push('/login');
      });
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
    toast.success('Logged out successfully');
  };

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/properties', label: 'Properties', icon: '🏠' },
    { href: '/tenants', label: 'Tenants', icon: '👥' },
    { href: '/payments', label: 'Payments', icon: '💰' },
    { href: '/expenses', label: 'Expenses', icon: '🧾' },
    { href: '/reports', label: 'Reports', icon: '📈' },
  ];

  if (user.role === 'admin') {
    navItems.push({ href: '/admin', label: 'Admin Panel', icon: '👨‍💼' });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Trial Expired Banner */}
      {trialExpired && (
        <div className="bg-yellow-500 text-white px-4 py-3 text-center">
          <p className="font-medium">
            Your trial has expired. Please subscribe to continue using all features.
            <Link href="/subscription" className="underline ml-2">Subscribe Now</Link>
          </p>
        </div>
      )}

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-64 bg-white">
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <h1 className="text-xl font-bold text-primary-600">RentManager</h1>
              <button onClick={() => setSidebarOpen(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-lg ${
                    router.pathname === item.href
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center h-16 px-4 border-b">
            <h1 className="text-xl font-bold text-primary-600">RentManager</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  router.pathname === item.href
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full btn-secondary text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pl-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-4">
              {user.isTrialActive && (
                <span className="text-sm text-gray-600">
                  Trial ends: {new Date(user.subscription.trialEndDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

