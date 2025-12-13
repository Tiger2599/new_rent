import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

export default function TenantLedger() {
  const router = useRouter();
  const { id } = router.query;
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchLedger();
    }
  }, [id]);

  const fetchLedger = async () => {
    try {
      const { data } = await api.get(`/payments/tenant/${id}/ledger`);
      setLedger(data);
    } catch (error) {
      toast.error('Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!ledger) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Tenant Ledger', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Tenant: ${ledger.tenant.name}`, 20, 35);
    doc.text(`Mobile: ${ledger.tenant.mobile}`, 20, 42);
    doc.text(`Property: ${ledger.tenant.property?.name || 'N/A'}`, 20, 49);
    doc.text(`Rent Amount: ₹${ledger.tenant.rentAmount}`, 20, 56);
    doc.text(`Deposit: ₹${ledger.tenant.deposit || 0}`, 20, 63);

    let y = 75;
    doc.setFontSize(10);
    doc.text('Date', 20, y);
    doc.text('Type', 50, y);
    doc.text('Amount', 80, y);
    doc.text('Mode', 110, y);
    doc.text('Balance', 150, y);
    y += 5;
    doc.line(20, y, 190, y);
    y += 8;

    ledger.ledger.forEach((entry) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      const date = entry.date || entry.paymentDate;
      const dateObj = date ? new Date(date) : null;
      const isValidDate = dateObj && !isNaN(dateObj.getTime());
      
      doc.text(isValidDate ? format(dateObj, 'dd/MM/yyyy') : 'N/A', 20, y);
      doc.text(entry.type || entry.paymentType, 50, y);
      doc.text(`₹${entry.amount}`, 80, y);
      doc.text(entry.mode || entry.paymentMode, 110, y);
      doc.text(`₹${entry.runningBalance.toFixed(2)}`, 150, y);
      y += 8;
    });

    y += 5;
    doc.line(20, y, 190, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`Current Balance: ₹${ledger.currentBalance.toFixed(2)}`, 20, y, { style: 'bold' });

    doc.save(`ledger-${ledger.tenant.name}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF exported successfully');
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

  if (!ledger) {
    return (
      <Layout>
        <div className="text-center py-8 text-gray-500">Ledger not found</div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Tenant Ledger - RentManager</title>
      </Head>
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <button onClick={() => router.back()} className="text-primary-600 hover:text-primary-800 mb-2">
                ← Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Tenant Ledger</h1>
            </div>
            <button onClick={exportToPDF} className="btn-secondary">
              Export PDF
            </button>
          </div>

          {/* Tenant Info */}
          <div className="card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold">{ledger.tenant.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mobile</p>
                <p className="font-semibold">{ledger.tenant.mobile}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rent Amount</p>
                <p className="font-semibold">₹{ledger.tenant.rentAmount?.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className={`font-semibold ${ledger.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{ledger.currentBalance?.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="card overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month/Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Running Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ledger.ledger.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  ledger.ledger.map((entry, index) => {
                    const date = entry.date || entry.paymentDate;
                    const dateObj = date ? new Date(date) : null;
                    const isValidDate = dateObj && !isNaN(dateObj.getTime());
                    
                    return (
                      <tr key={entry._id || index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isValidDate ? format(dateObj, 'dd MMM yyyy') : 'N/A'}
                        </td>
                        <td className="px-6 py-4">{entry.type || entry.paymentType}</td>
                        <td className={`px-6 py-4 font-semibold ${(entry.type || entry.paymentType) === 'Rent' ? 'text-green-600' : 'text-blue-600'}`}>
                          ₹{entry.amount?.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">{entry.mode || entry.paymentMode}</td>
                        <td className="px-6 py-4">{entry.month} {entry.year}</td>
                        <td className={`px-6 py-4 font-semibold ${entry.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{entry.runningBalance?.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Layout>
    </>
  );
}

