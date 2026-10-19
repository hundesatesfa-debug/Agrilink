'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/hooks/useTranslation';
import { apiClient } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { Target, Trophy, MapPin, ArrowRight, AlertCircle, Calculator } from 'lucide-react';

export default function RecommendPage() {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [crops, setCrops] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [quantity, setQuantity] = useState('');
  const [farmId, setFarmId] = useState('');
  const [latitude, setLatitude] = useState('7.6789');
  const [longitude, setLongitude] = useState('36.8340');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiClient.get('/crops', token).catch(() => []),
      apiClient.get('/farms', token).then((f: any) => {
        setFarms(f);
        if (f && f.length > 0) {
          setLatitude(String(f[0].latitude));
          setLongitude(String(f[0].longitude));
          setFarmId(f[0].id);
        }
        return f;
      }).catch(() => []),
    ]).then(([c]) => setCrops(c)).catch(() => {});
  }, [token]);

  const handleFarmSelect = (id: string) => {
    setFarmId(id);
    const farm = farms.find((f) => f.id === id);
    if (farm) {
      setLatitude(String(farm.latitude));
      setLongitude(String(farm.longitude));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrop || !quantity || !token) return;
    setLoading(true);
    setError('');
    try {
      const body: any = {
        cropId: Number(selectedCrop),
        quantity: parseFloat(quantity),
      };
      if (farmId) {
        body.farmId = Number(farmId);
      } else {
        body.latitude = parseFloat(latitude);
        body.longitude = parseFloat(longitude);
      }
      const res = await apiClient.post('/recommendations/where-to-sell', body, token);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Could not get recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
          <Target className="w-6 h-6 text-primary-600" />
          <span>{t('home.whereToSell')}</span>
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {t('home.whereToSellDesc')} — compares market prices after transport costs, so you keep more of your money.
        </p>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('recommend.selectCrop')}</label>
              <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="">-- Select --</option>
                {crops.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('recommend.enterQuantity')}</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min={1}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('recommend.confirmLocation')}</label>
              {farms.length > 0 ? (
                <select value={farmId} onChange={(e) => handleFarmSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none mb-2">
                  {farms.map((f: any) => (
                    <option key={f.id} value={f.id}>🏠 {f.name} ({f.woreda})</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-gray-500 mb-2">No farm registered yet — enter coordinates manually below.</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Latitude</label>
                  <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Longitude</label>
                  <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2 text-lg">
              <Target className="w-5 h-5" />
              <span>{loading ? t('common.loading') : t('recommend.findBest')}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && !result.recommended && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
            <p>{t('market.noPrices')} — Try a different crop or check back soon.</p>
          </div>
        )}

        {result && result.recommended && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className="w-6 h-6" />
                <span className="text-lg font-bold">{t('recommend.bestOption')}</span>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-5 h-5" />
                  <h2 className="text-2xl font-bold">{result.recommended.marketName}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/70">{t('recommend.netRevenue')}</span>
                    <p className="text-xl font-bold">{result.recommended.netRevenue.toLocaleString()} ETB</p>
                  </div>
                  <div>
                    <span className="text-white/70">{t('recommend.grossRevenue')}</span>
                    <p className="text-lg font-semibold">{result.recommended.grossRevenue.toLocaleString()} ETB</p>
                  </div>
                  <div>
                    <span className="text-white/70">Price</span>
                    <p className="font-semibold">{result.recommended.pricePerKg} ETB/kg</p>
                  </div>
                  <div>
                    <span className="text-white/70">{t('recommend.distance')}</span>
                    <p className="font-semibold">{result.recommended.distanceKm} km</p>
                  </div>
                  <div>
                    <span className="text-white/70">{t('recommend.transportCost')}</span>
                    <p className="font-semibold">{result.recommended.transportCost.toLocaleString()} ETB</p>
                  </div>
                  <div>
                    <span className="text-white/70">Transit fees</span>
                    <p className="font-semibold">{result.recommended.transitFees.toLocaleString()} ETB</p>
                  </div>
                  <div>
                    <span className="text-white/70">Quantity</span>
                    <p className="font-semibold">{Number(result.quantity || 0).toLocaleString()} kg</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white/10 rounded-lg">
                  <p className="text-sm flex items-start space-x-2">
                    <Calculator className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{result.recommended.reason}</span>
                  </p>
                </div>
              </div>
            </div>

            {result.alternatives && result.alternatives.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">{t('recommend.otherOptions')}</h3>
                <div className="space-y-3">
                  {result.alternatives.map((alt: any, i: number) => (
                    <div key={alt?.marketId ?? alt?.market?.id ?? `alt-${i}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <span className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                          {i + 2}
                        </span>
                        <div>
                          <h4 className="font-medium text-gray-900">{alt.marketName}</h4>
                          <p className="text-xs text-gray-500">
                            {alt.city} • {alt.pricePerKg} ETB/kg • {alt.distanceKm} km • Transport {(alt.transportCost ?? 0).toLocaleString()} ETB
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{(alt.netRevenue ?? 0).toLocaleString()} ETB</p>
                        <p className="text-xs text-gray-500">{t('recommend.netRevenue')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-3">How is this calculated?</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Gross revenue</span> = market price × quantity</p>
                <p><span className="font-medium">Transport cost</span> = distance × rate per km per ton × quantity (tons)</p>
                <p><span className="font-medium">Net revenue</span> = gross revenue − transport cost − transit fees</p>
                <p className="text-xs text-gray-400 mt-2">The market with the highest net revenue is recommended — not simply the one with the highest price.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}