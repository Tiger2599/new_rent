import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    tenant: '',
    property: '',
    amount: '',
    paymentType: 'Rent',
    paymentMode: 'Cash',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    notes: ''
  });

  useEffect(() => {
    fetchTenants();
    fetchProperties();
    fetchPayments();
  }, [page]);

  const fetchTenants = async () => {
    try {
      const { data } = await api.get('/tenants', { params: { limit: 1000 } });
      setTenants(data.tenants);
    } catch (error) {
      console.error('Failed to load tenants');
    }
  };

  const fetchProperties = async () => {
    try {
      const { data } = await api.get('/properties', { params: { limit: 1000 } });
      setProperties(data.properties);
    } catch (error) {
      console.error('Failed to load properties');
    }
  };

  const fetchPayments = async () => {
    try {
      const { data } = await api.get('/payments', {
        params: { page, limit: 10 }
      });
      setPayments(data.payments);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPayment) {
        await api.put(`/payments/${editingPayment._id}`, formData);
        toast.success('Payment updated successfully');
      } else {
        await api.post('/payments', formData);
        toast.success('Payment added successfully');
      }
      setShowModal(false);
      setEditingPayment(null);
      resetForm();
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save payment');
    }
  };

  const resetForm = () => {
    setFormData({
      tenant: '',
      property: '',
      amount: '',
      paymentType: 'Rent',
      paymentMode: 'Cash',
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear(),
      notes: ''
    });
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      tenant: payment.tenant._id || payment.tenant,
      property: payment.property._id || payment.property,
      amount: payment.amount,
      paymentType: payment.paymentType,
      paymentMode: payment.paymentMode,
      paymentDate: format(new Date(payment.paymentDate), 'yyyy-MM-dd'),
      month: payment.month,
      year: payment.year,
      notes: payment.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    try {
      await api.delete(`/payments/${id}`);
      toast.success('Payment deleted successfully');
      fetchPayments();
    } catch (error) {
      toast.error('Failed to delete payment');
    }
  };

  return (
    <>
      <Head>
        <title>Payments - RentManager</title>
      </Head>
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              + Add Payment
            </button>
          </div>

          <div className="card overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No payments found</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(payment.paymentDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4">{payment.tenant?.name || 'N/A'}</td>
                      <td className="px-6 py-4">{payment.property?.name || 'N/A'}</td>
                      <td className="px-6 py-4">{payment.paymentType}</td>
                      <td className="px-6 py-4 font-semibold text-green-600">
                        ₹{payment.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">{payment.paymentMode}</td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button onClick={() => handleEdit(payment)} className="text-primary-600 hover:text-primary-800">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(payment._id)} className="text-red-600 hover:text-red-800">
                          Delete
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

          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setEditingPayment(null);
              resetForm();
            }}
            title={editingPayment ? 'Edit Payment' : 'Add Payment'}
            size="lg"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tenant *</label>
                      <select
                        required
                        className="input-field"
                        value={formData.tenant}
                        onChange={(e) => setFormData({ ...formData, tenant: e.target.value })}
                      >
                        <option value="">Select Tenant</option>
                        {tenants.map((tenant) => (
                          <option key={tenant._id} value={tenant._id}>
                            {tenant.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Property *</label>
                      <select
                        required
                        className="input-field"
                        value={formData.property}
                        onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                      >
                        <option value="">Select Property</option>
                        {properties.map((prop) => (
                          <option key={prop._id} value={prop._id}>
                            {prop.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Amount *</label>
                      <input
                        type="number"
                        required
                        className="input-field"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Payment Type *</label>
                      <select
                        required
                        className="input-field"
                        value={formData.paymentType}
                        onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                      >
                        <option value="Rent">Rent</option>
                        <option value="Deposit">Deposit</option>
                        <option value="Token">Token</option>
                        <option value="Extra">Extra</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Payment Mode *</label>
                      <select
                        required
                        className="input-field"
                        value={formData.paymentMode}
                        onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Payment Date *</label>
                      <input
                        type="date"
                        required
                        className="input-field"
                        value={formData.paymentDate}
                        onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Month *</label>
                      <select
                        required
                        className="input-field"
                        value={formData.month}
                        onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      >
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Year *</label>
                      <input
                        type="number"
                        required
                        className="input-field"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      className="input-field"
                      rows="3"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button type="submit" className="btn-primary flex-1">
                      {editingPayment ? 'Update' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingPayment(null);
                        resetForm();
                      }}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
          </Modal>
        </div>
      </Layout>
    </>
  );
}

