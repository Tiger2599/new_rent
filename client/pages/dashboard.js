import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/dashboard/stats');
      setStats(data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - RentManager</title>
      </Head>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Properties</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalProperties || 0}</p>
                </div>
                <div className="text-4xl">🏠</div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tenants</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalTenants || 0}</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vacant Properties</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.vacantCount || 0}</p>
                </div>
                <div className="text-4xl">🔑</div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Rent</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    ₹{stats?.thisMonth?.pendingRent?.toLocaleString('en-IN') || 0}
                  </p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>
          </div>

          {/* This Month Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">This Month</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rent Due</span>
                  <span className="font-semibold">₹{stats?.thisMonth?.rentDue?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rent Collected</span>
                  <span className="font-semibold text-green-600">
                    ₹{stats?.thisMonth?.rentCollected?.toLocaleString('en-IN') || 0}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-semibold text-red-600">
                    ₹{stats?.thisMonth?.pendingRent?.toLocaleString('en-IN') || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Agreement Expiry Alerts */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Agreement Expiry Alerts</h3>
              {stats?.expiringAgreements?.length > 0 ? (
                <div className="space-y-2">
                  {stats.expiringAgreements.slice(0, 5).map((agreement) => (
                    <div key={agreement._id} className="p-2 bg-yellow-50 rounded">
                      <p className="text-sm font-medium">{agreement.name}</p>
                      <p className="text-xs text-gray-600">{agreement.property?.name}</p>
                      <p className="text-xs text-red-600">
                        Expires: {format(new Date(agreement.agreementEndDate), 'dd MMM yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No agreements expiring soon</p>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
              {stats?.recentTransactions?.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentTransactions.map((transaction) => (
                    <div key={transaction._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium">{transaction.tenant?.name}</p>
                        <p className="text-xs text-gray-600">{transaction.paymentType} • {transaction.paymentMode}</p>
                      </div>
                      <p className="text-sm font-semibold text-green-600">
                        ₹{transaction.amount?.toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent transactions</p>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

