import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('balance');
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [propertyIncome, setPropertyIncome] = useState([]);
  const [yearlySummary, setYearlySummary] = useState(null);
  const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    if (activeTab === 'balance') {
      fetchBalanceSheet();
    } else if (activeTab === 'property') {
      fetchPropertyIncome();
    } else if (activeTab === 'yearly') {
      fetchYearlySummary();
    }
  }, [activeTab, month, year]);

  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/balance-sheet', {
        params: { month, year }
      });
      setBalanceSheet(data);
    } catch (error) {
      toast.error('Failed to load balance sheet');
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyIncome = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/property-income', {
        params: { month, year }
      });
      setPropertyIncome(data);
    } catch (error) {
      toast.error('Failed to load property income');
    } finally {
      setLoading(false);
    }
  };

  const fetchYearlySummary = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/yearly-summary', {
        params: { year }
      });
      setYearlySummary(data);
    } catch (error) {
      toast.error('Failed to load yearly summary');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Balance Sheet Report', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`${month} ${year}`, 105, 30, { align: 'center' });
    
    let y = 50;
    if (balanceSheet) {
      doc.text(`Total Income: ₹${balanceSheet.income.total.toLocaleString('en-IN')}`, 20, y);
      y += 10;
      doc.text(`Total Expenses: ₹${balanceSheet.expenses.total.toLocaleString('en-IN')}`, 20, y);
      y += 10;
      doc.text(`Net Profit: ₹${balanceSheet.netProfit.toLocaleString('en-IN')}`, 20, y);
    }
    
    doc.save(`balance-sheet-${month}-${year}.pdf`);
    toast.success('PDF exported successfully');
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(propertyIncome);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Property Income');
    XLSX.writeFile(wb, `property-income-${month}-${year}.xlsx`);
    toast.success('Excel exported successfully');
  };

  return (
    <>
      <Head>
        <title>Reports - RentManager</title>
      </Head>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>

          {/* Filters */}
          <div className="card">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Month</label>
                <select
                  className="input-field"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                >
                  {months.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Year</label>
                <select
                  className="input-field"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'balance', label: 'Balance Sheet' },
                { id: 'property', label: 'Property Income' },
                { id: 'yearly', label: 'Yearly Summary' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Balance Sheet */}
          {activeTab === 'balance' && (
            <div className="card">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : balanceSheet ? (
                <div className="space-y-6">
                  <div className="flex justify-end space-x-2">
                    <button onClick={exportToPDF} className="btn-secondary">
                      Export PDF
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Income</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Rent Income</span>
                          <span className="font-semibold text-green-600">
                            ₹{balanceSheet.income.rent.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="font-semibold">Total Income</span>
                          <span className="font-semibold text-green-600">
                            ₹{balanceSheet.income.total.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Expenses</h3>
                      <div className="space-y-2">
                        {Object.entries(balanceSheet.expenses.byCategory || {}).map(([cat, amount]) => (
                          <div key={cat} className="flex justify-between">
                            <span>{cat}</span>
                            <span className="font-semibold text-red-600">
                              ₹{amount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t">
                          <span className="font-semibold">Total Expenses</span>
                          <span className="font-semibold text-red-600">
                            ₹{balanceSheet.expenses.total.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">Net Profit</span>
                      <span className={`text-2xl font-bold ${balanceSheet.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{balanceSheet.netProfit.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No data available</div>
              )}
            </div>
          )}

          {/* Property Income */}
          {activeTab === 'property' && (
            <div className="card">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : propertyIncome.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button onClick={exportToExcel} className="btn-secondary">
                      Export Excel
                    </button>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Income</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payments</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {propertyIncome.map((item) => (
                        <tr key={item._id}>
                          <td className="px-6 py-4">{item.propertyName}</td>
                          <td className="px-6 py-4 font-semibold text-green-600">
                            ₹{item.totalIncome.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4">{item.paymentCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No data available</div>
              )}
            </div>
          )}

          {/* Yearly Summary */}
          {activeTab === 'yearly' && (
            <div className="card">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : yearlySummary ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Monthly Breakdown</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Income</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expenses</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.entries(yearlySummary.monthlyData).map(([month, data]) => (
                            <tr key={month}>
                              <td className="px-6 py-4">{month}</td>
                              <td className="px-6 py-4 text-green-600">₹{data.income.toLocaleString('en-IN')}</td>
                              <td className="px-6 py-4 text-red-600">₹{data.expenses.toLocaleString('en-IN')}</td>
                              <td className={`px-6 py-4 font-semibold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{data.profit.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Income</p>
                        <p className="text-2xl font-bold text-green-600">
                          ₹{yearlySummary.yearlyTotal.income.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Expenses</p>
                        <p className="text-2xl font-bold text-red-600">
                          ₹{yearlySummary.yearlyTotal.expenses.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Net Profit</p>
                        <p className={`text-2xl font-bold ${yearlySummary.yearlyTotal.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{yearlySummary.yearlyTotal.profit.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No data available</div>
              )}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}

