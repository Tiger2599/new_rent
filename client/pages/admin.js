import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { getAuth } from '../lib/auth';
import { useRouter } from 'next/router';

export default function Admin() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const { user } = getAuth();
    if (!user || user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchUsers();
    fetchStats();
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users', {
        params: { page, limit: 10, search }
      });
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const handleBlock = async (userId, isBlocked) => {
    try {
      await api.patch(`/admin/users/${userId}/block`, { isBlocked: !isBlocked });
      toast.success(isBlocked ? 'User unblocked' : 'User blocked');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleExtendTrial = async (userId) => {
    const days = prompt('Enter number of days to extend:');
    if (!days || isNaN(days)) return;
    try {
      await api.patch(`/admin/users/${userId}/extend-trial`, { days: parseInt(days) });
      toast.success('Trial extended successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to extend trial');
    }
  };

  return (
    <>
      <Head>
        <title>Admin Panel - RentManager</title>
      </Head>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-600">Active Trials</p>
                <p className="text-3xl font-bold mt-1">{stats.activeTrials}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-600">Active Subscriptions</p>
                <p className="text-3xl font-bold mt-1">{stats.activeSubscriptions}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-600">Blocked Users</p>
                <p className="text-3xl font-bold mt-1">{stats.blockedUsers}</p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="card">
            <input
              type="text"
              placeholder="Search users..."
              className="input-field"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Users Table */}
          <div className="card overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No users found</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trial End</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 font-medium">{user.name}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {user.subscription?.plan || 'free'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.subscription?.trialEndDate
                          ? new Date(user.subscription.trialEndDate).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {user.isBlocked ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Blocked</span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handleBlock(user.id, user.isBlocked)}
                          className={`${user.isBlocked ? 'text-green-600' : 'text-red-600'} hover:underline`}
                        >
                          {user.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                        <button
                          onClick={() => handleExtendTrial(user.id)}
                          className="text-primary-600 hover:underline"
                        >
                          Extend Trial
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}

