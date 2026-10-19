'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Activity, AlertCircle } from 'lucide-react';

export default function TransactionsPage() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiClient.get('/transactions/mine', token)
      .then(setTransactions)
      .catch(() => [])
      .finally(() => setLoading(false));
  }, [token]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      NEGOTIATING: 'bg-blue-100 text-blue-700',
      AGREED: 'bg-purple-100 text-purple-700',
      IN_PROGRESS: 'bg-amber-100 text-amber-700',
      COMPLETED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return map[s] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
          <Activity className="w-6 h-6 text-primary-600" />
          <span>My Transactions</span>
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Your selling history. This history will support future financial and credit features.
        </p>

        {loading ? (
          <div className="bg-white rounded-xl border p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No transactions yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b bg-gray-50">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Crop</th>
                    <th className="py-3 px-4">Qty</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Gross</th>
                    <th className="py-3 px-4">Transport</th>
                    <th className="py-3 px-4">Net</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tr: any) => (
                    <tr key={tr.id} className="border-b last:border-0">
                      <td className="py-3 px-4 whitespace-nowrap">{new Date(tr.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{tr.crop?.name}</td>
                      <td className="py-3 px-4">{Number(tr.quantity || 0).toLocaleString()} {tr.unit || 'kg'}</td>
                      <td className="py-3 px-4">{tr.agreedPrice} ETB/{tr.unit || 'kg'}</td>
                      <td className="py-3 px-4">{tr.grossValue.toLocaleString()} ETB</td>
                      <td className="py-3 px-4">{tr.transportCost.toLocaleString()} ETB</td>
                      <td className="py-3 px-4 font-bold text-primary-700">{tr.netValue.toLocaleString()} ETB</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusBadge(tr.status)}`}>{tr.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}