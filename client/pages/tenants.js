import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    property: '',
    rentAmount: '',
    deposit: '',
    rentStartDate: '',
    agreementEndDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchProperties();
    fetchTenants();
  }, [page, search]);

  const fetchProperties = async () => {
    try {
      const { data } = await api.get('/properties', { params: { limit: 1000 } });
      setProperties(data.properties);
    } catch (error) {
      toast.error('Failed to load properties');
    }
  };

  const fetchTenants = async () => {
    try {
      const { data } = await api.get('/tenants', {
        params: { page, limit: 10, search }
      });
      setTenants(data.tenants);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTenant) {
        await api.put(`/tenants/${editingTenant._id}`, formData);
        toast.success('Tenant updated successfully');
      } else {
        await api.post('/tenants', formData);
        toast.success('Tenant added successfully');
      }
      setShowModal(false);
      setEditingTenant(null);
      resetForm();
      fetchTenants();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save tenant');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      property: '',
      rentAmount: '',
      deposit: '',
      rentStartDate: '',
      agreementEndDate: '',
      notes: ''
    });
  };

  const handleEdit = (tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      mobile: tenant.mobile,
      property: tenant.property._id || tenant.property,
      rentAmount: tenant.rentAmount,
      deposit: tenant.deposit || '',
      rentStartDate: format(new Date(tenant.rentStartDate), 'yyyy-MM-dd'),
      agreementEndDate: format(new Date(tenant.agreementEndDate), 'yyyy-MM-dd'),
      notes: tenant.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this tenant?')) return;
    try {
      await api.delete(`/tenants/${id}`);
      toast.success('Tenant deleted successfully');
      fetchTenants();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete tenant');
    }
  };

  const handleDocumentUpload = async (tenantId, type, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/tenants/${tenantId}/documents/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded successfully');
      fetchTenants();
    } catch (error) {
      toast.error('Failed to upload document');
    }
  };

  return (
    <>
      <Head>
        <title>Tenants - RentManager</title>
      </Head>
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              + Add Tenant
            </button>
          </div>

          <div className="card">
            <input
              type="text"
              placeholder="Search tenants..."
              className="input-field"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="card overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No tenants found</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agreement End</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tenants.map((tenant) => (
                    <tr key={tenant._id}>
                      <td className="px-6 py-4 font-medium">{tenant.name}</td>
                      <td className="px-6 py-4">{tenant.mobile}</td>
                      <td className="px-6 py-4">{tenant.property?.name || 'N/A'}</td>
                      <td className="px-6 py-4">₹{tenant.rentAmount?.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4">
                        {format(new Date(tenant.agreementEndDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <a
                          href={`/tenants/${tenant._id}/ledger`}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          Ledger
                        </a>
                        <button onClick={() => handleEdit(tenant)} className="text-primary-600 hover:text-primary-800">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(tenant._id)} className="text-red-600 hover:text-red-800">
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
              setEditingTenant(null);
              resetForm();
            }}
            title={editingTenant ? 'Edit Tenant' : 'Add Tenant'}
            size="lg"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name *</label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Mobile *</label>
                      <input
                        type="tel"
                        required
                        className="input-field"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      />
                    </div>
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
                          {prop.name} - {prop.address}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Rent Amount *</label>
                      <input
                        type="number"
                        required
                        className="input-field"
                        value={formData.rentAmount}
                        onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Deposit</label>
                      <input
                        type="number"
                        className="input-field"
                        value={formData.deposit}
                        onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Rent Start Date *</label>
                      <input
                        type="date"
                        required
                        className="input-field"
                        value={formData.rentStartDate}
                        onChange={(e) => setFormData({ ...formData, rentStartDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Agreement End Date *</label>
                      <input
                        type="date"
                        required
                        className="input-field"
                        value={formData.agreementEndDate}
                        onChange={(e) => setFormData({ ...formData, agreementEndDate: e.target.value })}
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
                      {editingTenant ? 'Update' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingTenant(null);
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

