'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/hooks/useTranslation';
import { apiClient } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { TrendingUp, CheckCircle, Clock } from 'lucide-react';

export default function MarketsPage() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [prices, setPrices] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiClient.get('/prices', token).catch(() => []),
      apiClient.get('/crops', token).catch(() => []),
    ]).then(([p, c]) => {
      setPrices(p);
      setCrops(c);
    }).finally(() => setLoading(false));
  }, [token]);

  const filteredPrices = selectedCrop
    ? prices.filter((p: any) => String(p.cropId) === selectedCrop)
    : prices;

  const groupedByMarket: Record<string, any[]> = {};
  filteredPrices.forEach((p: any) => {
    const key = p.marketId;
    if (!groupedByMarket[key]) groupedByMarket[key] = [];
    groupedByMarket[key].push(p);
  });

  const daysSince = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-primary-600" />
          <span>{t('market.currentPrices')}</span>
        </h1>
        <p className="text-gray-500 text-sm mb-6">View current and recent prices across all markets</p>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : Object.keys(groupedByMarket).length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border">
            <p className="text-gray-500">{t('market.noPrices')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByMarket).map(([marketId, marketPrices]) => {
              const market = marketPrices[0]?.market;
              return (
                <div key={marketId} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b">
                    <h2 className="font-semibold text-gray-900">{market?.name}</h2>
                    <p className="text-xs text-gray-500">{market?.city} • {market?.type || 'MARKET'}</p>
                  </div>
                  <div className="divide-y">
                    {marketPrices.map((p: any) => (
                      <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">{p.crop?.name}</span>
                          {p.grade && <span className="text-xs text-gray-500 ml-2">({p.grade})</span>}
                        </div>
                        <div className="text-right flex items-center space-x-3">
                          <div>
                            <span className="text-lg font-bold text-primary-700">{p.pricePerKg}</span>
                            <span className="text-xs text-gray-500 ml-1">ETB/kg</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {p.verificationStatus === 'VERIFIED' ? (
                              <span className="text-green-600 flex items-center"><CheckCircle className="w-3 h-3 mr-1" />{t('market.verified')}</span>
                            ) : (
                              <span className="text-gray-400">{t('market.unverified')}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {t('market.updatedAgo', { days: daysSince(p.observationDate) })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}