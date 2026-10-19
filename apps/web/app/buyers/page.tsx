'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/hooks/useTranslation';
import { apiClient } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { Users, ShieldAlert, BadgeCheck } from 'lucide-react';

export default function BuyersPage() {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const [demands, setDemands] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiClient.get('/buyers/demands', token).catch(() => []),
      apiClient.get('/crops', token).catch(() => []),
    ]).then(([d, c]) => {
      setDemands(d);
      setCrops(c);
    }).finally(() => setLoading(false));
  }, [token]);

  const filtered = selectedCrop ? demands.filter((d: any) => String(d.cropId) === selectedCrop) : demands;

  const verificationBadge = (b: any) => {
    const status = b?.verificationStatus;
    if (status === 'VERIFIED') return { text: 'Verified buyer', cls: 'bg-green-100 text-green-700', icon: BadgeCheck };
    if (status === 'PENDING') return { text: 'Verification pending', cls: 'bg-amber-100 text-amber-700', icon: ShieldAlert };
    return { text: status || 'Unverified', cls: 'bg-gray-100 text-gray-500', icon: ShieldAlert };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
          <Users className="w-6 h-6 text-amber-600" />
          <span>{t('home.findBuyers')}</span>
        </h1>
        <p className="text-gray-500 text-sm mb-6">Active buying demands. Contact a buyer to agree on price and quantity.</p>

        <div className="mb-6">
          <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="">All Crops</option>
            {crops.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border">
            <p className="text-gray-500">No active buyers were found for this crop.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((d: any) => {
              const badge = verificationBadge(d.buyer);
              const BadgeIcon = badge.icon;
              return (
                <div key={d.id} className="bg-white rounded-xl shadow-sm border p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{d.buyer?.businessName}</h3>
                      <p className="text-xs text-gray-500">{d.location || d.buyer?.serviceArea || 'Location not set'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full flex items-center space-x-1 ${badge.cls}`}>
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.text}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-gray-500 block">Crop</span>
                      <span className="font-medium">{d.crop?.name}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Quality</span>
                      <span className="font-medium">{d.grade || 'standard'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Quantity needed</span>
                      <span className="font-medium">{Number(d.quantity || 0).toLocaleString()} {d.unit || 'kg'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Offered price</span>
                      <span className="font-medium text-primary-700">
                        {d.offeredPrice != null ? `${d.offeredPrice} ETB/${d.unit || 'kg'}` : 'Ask'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {d.status === 'OPEN' ? '🟢 Buying now' : d.status}
                      {d.buyer?._count?.transactions != null && ` • ${d.buyer._count.transactions} sale${d.buyer._count.transactions === 1 ? '' : 's'} to date`}
                    </span>
                    <span>{new Date(d.postedAt || d.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {user?.role === 'BUYER' && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Buyer tools</h2>
            <p className="text-sm text-gray-500 mb-4">Post your demand so farmers can see what you are buying.</p>
            <a href="/buyers/demand" className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">
              Post a Demand
            </a>
          </div>
        )}
      </div>
    </div>
  );
}