'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { AlertCircle, PlusCircle } from 'lucide-react';

export default function DemandPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [crops, setCrops] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    cropId: '', quantity: '', grade: 'standard', offeredPrice: '',
    location: '', status: 'OPEN',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiClient.get('/crops', token).then(setCrops).catch(() => []);
  }, [token]);

  if (user && user.role !== 'BUYER') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <p className="text-red-600">This page is for buyers only.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload: any = {};
      for (const key of ['cropId', 'grade', 'quantity', 'offeredPrice', 'location', 'status']) {
        if (form[key] !== '' && form[key] != null) payload[key] = form[key];
      }
      payload.cropId = Number(payload.cropId);
      payload.quantity = parseFloat(payload.quantity);
      if (payload.offeredPrice) payload.offeredPrice = parseFloat(payload.offeredPrice);
      delete payload.notes;
      await apiClient.post('/buyers/me/demands', payload, token);
      setSuccess('Demand posted successfully!');
      router.push('/buyers');
    } catch (err: any) {
      setError(err.message || 'Failed to post demand');
    } finally {
      setLoading(false);
    }
  };

  const upd = (f: string, v: string) => setForm((prev: any) => ({ ...prev, [f]: v }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <PlusCircle className="w-6 h-6 text-primary-600" />
          <span>Post Buying Demand</span>
        </h1>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" /><span>{error}</span>
        </div>}
        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
            <select value={form.cropId} onChange={(e) => upd('cropId', e.target.value)} required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">-- Select --</option>
              {crops.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity ({form.unit || 'kg'})</label>
              <input type="number" min={1} value={form.quantity} onChange={(e) => upd('quantity', e.target.value)} required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Offered price (ETB/kg)</label>
              <input type="number" min={0} step="any" value={form.offeredPrice} onChange={(e) => upd('offeredPrice', e.target.value)} required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select value={form.grade} onChange={(e) => upd('grade', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="">Standard / not specified</option>
                <option value="Grade A">Grade A</option>
                <option value="Grade B">Grade B</option>
                <option value="Grade C">Grade C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => upd('status', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="OPEN">Open</option>
                <option value="PAUSED">Paused</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location / Delivery point</label>
            <input type="text" value={form.location} onChange={(e) => upd('location', e.target.value)}
              placeholder="e.g. Jimma town, near the gristmill"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Posting...' : 'Post Demand'}
          </button>
        </form>
      </div>
    </div>
  );
}