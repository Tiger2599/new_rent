import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    property: '',
    tenant: '',
    amount: '',
    category: 'Repair',
    description: '',
    expenseDate: format(new Date(), 'yyyy-MM-dd'),
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear()
  });

  useEffect(() => {
    fetchProperties();
    fetchTenants();
    fetchExpenses();
  }, [page]);

  const fetchProperties = async () => {
    try {
      const { data } = await api.get('/properties', { params: { limit: 1000 } });
      setProperties(data.properties);
    } catch (error) {
      console.error('Failed to load properties');
    }
  };

  const fetchTenants = async () => {
    try {
      const { data } = await api.get('/tenants', { params: { limit: 1000 } });
      setTenants(data.tenants);
    } catch (error) {
      console.error('Failed to load tenants');
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get('/expenses', {
        params: { page, limit: 10 }
      });
      setExpenses(data.expenses);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (!submitData.tenant) delete submitData.tenant;
      
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense._id}`, submitData);
        toast.success('Expense updated successfully');
      } else {
        await api.post('/expenses', submitData);
        toast.success('Expense added successfully');
      }
      setShowModal(false);
      setEditingExpense(null);
      resetForm();
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save expense');
    }
  };

  const resetForm = () => {
    setFormData({
      property: '',
      tenant: '',
      amount: '',
      category: 'Repair',
      description: '',
      expenseDate: format(new Date(), 'yyyy-MM-dd'),
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear()
    });
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      property: expense.property._id || expense.property,
      tenant: expense.tenant?._id || expense.tenant || '',
      amount: expense.amount,
      category: expense.category,
      description: expense.description || '',
      expenseDate: format(new Date(expense.expenseDate), 'yyyy-MM-dd'),
      month: expense.month,
      year: expense.year
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted successfully');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  return (
    <>
      <Head>
        <title>Expenses - RentManager</title>
      </Head>
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              + Add Expense
            </button>
          </div>

          <div className="card overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No expenses found</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(expense.expenseDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4">{expense.property?.name || 'N/A'}</td>
                      <td className="px-6 py-4">{expense.tenant?.name || '-'}</td>
                      <td className="px-6 py-4">{expense.category}</td>
                      <td className="px-6 py-4 font-semibold text-red-600">
                        ₹{expense.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">{expense.description || '-'}</td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button onClick={() => handleEdit(expense)} className="text-primary-600 hover:text-primary-800">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(expense._id)} className="text-red-600 hover:text-red-800">
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
              setEditingExpense(null);
              resetForm();
            }}
            title={editingExpense ? 'Edit Expense' : 'Add Expense'}
            size="lg"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                    <div>
                      <label className="block text-sm font-medium mb-1">Tenant (Optional)</label>
                      <select
                        className="input-field"
                        value={formData.tenant}
                        onChange={(e) => setFormData({ ...formData, tenant: e.target.value })}
                      >
                        <option value="">None</option>
                        {tenants.map((tenant) => (
                          <option key={tenant._id} value={tenant._id}>
                            {tenant.name}
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
                      <label className="block text-sm font-medium mb-1">Category *</label>
                      <select
                        required
                        className="input-field"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="Repair">Repair</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Utilities">Utilities</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Expense Date *</label>
                      <input
                        type="date"
                        required
                        className="input-field"
                        value={formData.expenseDate}
                        onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                      />
                    </div>
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
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      className="input-field"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button type="submit" className="btn-primary flex-1">
                      {editingExpense ? 'Update' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingExpense(null);
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

