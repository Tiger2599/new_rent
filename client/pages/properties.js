import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'Flat',
    rentCycle: 'Monthly',
    status: 'Vacant'
  });

  useEffect(() => {
    fetchProperties();
  }, [page, search]);

  const fetchProperties = async () => {
    try {
      const { data } = await api.get('/properties', {
        params: { page, limit: 10, search }
      });
      setProperties(data.properties);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProperty) {
        await api.put(`/properties/${editingProperty._id}`, formData);
        toast.success('Property updated successfully');
      } else {
        await api.post('/properties', formData);
        toast.success('Property added successfully');
      }
      setShowModal(false);
      setEditingProperty(null);
      setFormData({ name: '', address: '', type: 'Flat', rentCycle: 'Monthly', status: 'Vacant' });
      fetchProperties();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save property');
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      address: property.address,
      type: property.type,
      rentCycle: property.rentCycle,
      status: property.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    try {
      await api.delete(`/properties/${id}`);
      toast.success('Property deleted successfully');
      fetchProperties();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete property');
    }
  };

  return (
    <>
      <Head>
        <title>Properties - RentManager</title>
      </Head>
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              + Add Property
            </button>
          </div>

          {/* Search */}
          <div className="card">
            <input
              type="text"
              placeholder="Search properties..."
              className="input-field"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Properties Table */}
          <div className="card overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : properties.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No properties found</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rent Cycle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {properties.map((property) => (
                    <tr key={property._id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{property.name}</td>
                      <td className="px-6 py-4">{property.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{property.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{property.rentCycle}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          property.status === 'Occupied' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {property.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button onClick={() => handleEdit(property)} className="text-primary-600 hover:text-primary-800">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(property._id)} className="text-red-600 hover:text-red-800">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
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

          {/* Modal */}
          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setEditingProperty(null);
              setFormData({ name: '', address: '', type: 'Flat', rentCycle: 'Monthly', status: 'Vacant' });
            }}
            title={editingProperty ? 'Edit Property' : 'Add Property'}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  required
                  className="input-field"
                  rows="3"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  className="input-field"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Flat">Flat</option>
                  <option value="House">House</option>
                  <option value="Shop">Shop</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rent Cycle</label>
                <select
                  className="input-field"
                  value={formData.rentCycle}
                  onChange={(e) => setFormData({ ...formData, rentCycle: e.target.value })}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div className="flex space-x-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingProperty ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProperty(null);
                    setFormData({ name: '', address: '', type: 'Flat', rentCycle: 'Monthly', status: 'Vacant' });
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

