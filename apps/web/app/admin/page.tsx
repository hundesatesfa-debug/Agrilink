'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import Navbar from '@/components/Navbar';
import {
  Users, Store, Truck, ShoppingCart, Activity, Crop as CropIcon,
  MapPin, TrendingUp, Wallet, BadgeCheck, Clock, Package,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [crops, setCrops] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState('overview');
  const [newMarket, setNewMarket] = useState({ name: '', nameOm: '', city: '', latitude: '', longitude: '', type: 'PRIMARY' });
  const [newPrice, setNewPrice] = useState({ cropId: '', marketId: '', grade: '', pricePerKg: '', observationDate: '' });
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [newCrop, setNewCrop] = useState({ name: '', nameOm: '', category: '' });
  const [newRate, setNewRate] = useState({ routeType: 'general', vehicleType: '', ratePerKmPerTon: '' });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.push('/login');
  }, [user, loading, router]);

  const load = () => {
    if (!user || !token || user.role !== 'ADMIN') return;
    Promise.all([
      apiClient.get('/admin/dashboard', token).catch((e) => { setLoadError(e.message); return null; }),
      apiClient.get('/crops', token).catch(() => []),
      apiClient.get('/markets', token).catch(() => []),
      apiClient.get('/admin/prices', token).catch(() => []),
      apiClient.get('/admin/transport-rates', token).catch(() => []),
      apiClient.get('/transactions', token).then((t: any) => t?.items || []).catch(() => []),
    ]).then(([d, c, m, p, r, tx]) => {
      setData(d);
      setCrops(c);
      setMarkets(m);
      setPrices(p);
      setRates(r);
      setTransactions(tx);
    });
  };

  useEffect(load, [user, token]);

  if (loading || !user || user.role !== 'ADMIN') return null;

  const counts = data?.counts || {};

  const addMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg(''); setActionError('');
    try {
      await apiClient.post('/admin/markets', {
        name: newMarket.name ?? '', nameOm: newMarket.nameOm ?? '', city: newMarket.city ?? '', type: newMarket.type ?? 'PRIMARY',
        latitude: parseFloat(newMarket.latitude ?? ''), longitude: parseFloat(newMarket.longitude ?? ''),
      }, token || undefined);
      setActionMsg('Market created!');
      setNewMarket({ name: '', nameOm: '', city: '', latitude: '', longitude: '', type: 'PRIMARY' });
      load();
    } catch (err: any) { setActionError(err.message); }
  };

  const addPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg(''); setActionError('');
    try {
      await apiClient.post('/admin/prices', {
        cropId: Number(newPrice.cropId), marketId: Number(newPrice.marketId),
        grade: newPrice.grade || undefined,
        pricePerKg: parseFloat(newPrice.pricePerKg),
        observationDate: newPrice.observationDate || undefined,
        source: 'ADMIN_ENTRY',
      }, token || undefined);
      setActionMsg('Price recorded!');
      setNewPrice({ cropId: '', marketId: '', grade: '', pricePerKg: '', observationDate: '' });
      load();
    } catch (err: any) { setActionError(err.message); }
  };

  const addCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg(''); setActionError('');
    try {
      await apiClient.post('/admin/crops', {
        name: newCrop.name, nameOm: newCrop.nameOm, category: newCrop.category || undefined,
      }, token || undefined);
      setActionMsg('Crop created!');
      setNewCrop({ name: '', nameOm: '', category: '' });
      load();
    } catch (err: any) { setActionError(err.message); }
  };

  const addRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg(''); setActionError('');
    try {
      await apiClient.post('/admin/transport-rates', {
        routeType: newRate.routeType,
        vehicleType: newRate.vehicleType,
        ratePerKmPerTon: parseFloat(newRate.ratePerKmPerTon),
      }, token || undefined);
      setActionMsg('Transport rate added!');
      setNewRate({ routeType: 'general', vehicleType: '', ratePerKmPerTon: '' });
      load();
    } catch (err: any) { setActionError(err.message); }
  };

  const statCards = [
    { label: 'Farmers', value: counts.farmers ?? '—', icon: Users, color: 'bg-primary-500' },
    { label: 'Buyers', value: counts.buyers ?? '—', icon: Store, color: 'bg-amber-500' },
    { label: 'Transporters', value: counts.transporters ?? '—', icon: Truck, color: 'bg-purple-500' },
    { label: 'Active Markets', value: counts.activeMarkets ?? '—', icon: MapPin, color: 'bg-blue-500' },
    { label: 'Active Demands', value: counts.activeDemands ?? '—', icon: ShoppingCart, color: 'bg-teal-500' },
    { label: 'Transactions', value: counts.completedTransactions ?? '—', icon: Activity, color: 'bg-red-500' },
    { label: 'Crop Volume (kg)', value: (counts.totalCropVolume ?? 0).toLocaleString(), icon: CropIcon, color: 'bg-green-600' },
    { label: 'Avg Price (ETB/kg)', value: (counts.avgPricePerKg ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 }), icon: TrendingUp, color: 'bg-indigo-500' },
    { label: 'Verified Prices', value: counts.verifiedPrices ?? '—', icon: BadgeCheck, color: 'bg-emerald-500' },
    { label: 'Pending/Expired', value: counts.unverifiedPrices ?? '—', icon: Clock, color: 'bg-amber-600' },
    { label: 'Transport Requests', value: counts.transportRequests ?? '—', icon: Package, color: 'bg-cyan-600' },
    { label: 'Shipments In Transit', value: counts.shipmentsInTransit ?? '—', icon: Truck, color: 'bg-orange-500' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'markets', label: 'Markets' },
    { id: 'prices', label: 'Prices' },
    { id: 'crops', label: 'Crops' },
    { id: 'rates', label: 'Transport Rates' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
          <Wallet className="w-6 h-6 text-primary-600" />
          <span>Admin Dashboard</span>
        </h1>
        <p className="text-gray-500 text-sm mb-6">Manage markets, prices, crops, transport rates, and platform activity.</p>

        {loadError && <div className="mb-4 p-3 bg-red-50 border rounded-lg text-red-700 text-sm">{loadError}</div>}
        {actionMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{actionMsg}</div>}
        {actionError && <div className="mb-4 p-3 bg-red-50 border rounded-lg text-red-700 text-sm">{actionError}</div>}

        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {tabs.map((tb) => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === tb.id ? 'bg-primary-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}>
              {tb.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map((s) => (
                <div key={s.label} className="bg-white rounded-xl shadow-sm border p-4">
                  <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center mb-2`}>
                    <s.icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Recent Transactions</h2>
              {!transactions.length ? (
                <p className="text-gray-500 text-sm">No transactions yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2 pr-4">Crop</th>
                        <th className="py-2 pr-4">Buyer</th>
                        <th className="py-2 pr-4">Qty</th>
                        <th className="py-2 pr-4">Gross</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 10).map((tr: any) => (
                        <tr key={tr.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">{tr.crop?.name}</td>
                          <td className="py-2 pr-4">{tr.buyer?.businessName || `Buyer #${tr.buyerId}`}</td>
                          <td className="py-2 pr-4">{Number(tr.quantity || 0).toLocaleString()} {tr.unit || 'kg'}</td>
                          <td className="py-2 pr-4">{tr.grossValue?.toLocaleString()} ETB</td>
                          <td className="py-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">{tr.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'markets' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Markets</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {markets.map((m: any) => (
                <div key={m.id} className="p-3 bg-gray-50 rounded-lg border">
                  <p className="font-medium text-sm">{m.name} {m.nameOm ? `(${m.nameOm})` : ''}</p>
                  <p className="text-xs text-gray-500">{m.city} • {m.type} • {m.active ? 'Active' : 'Disabled'}</p>
                </div>
              ))}
            </div>
            <form onSubmit={addMarket} className="space-y-3 border-t pt-4">
              <h3 className="font-medium text-sm">Create Market</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input placeholder="Name" value={newMarket.name} onChange={(e) => setNewMarket({ ...newMarket, name: e.target.value })} required className="px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="Name (Afaan Oromoo)" value={newMarket.nameOm} onChange={(e) => setNewMarket({ ...newMarket, nameOm: e.target.value })} required className="px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="City" value={newMarket.city} onChange={(e) => setNewMarket({ ...newMarket, city: e.target.value })} required className="px-3 py-2 border rounded-lg text-sm" />
                <select value={newMarket.type} onChange={(e) => setNewMarket({ ...newMarket, type: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-sm">
                  <option value="PRIMARY">Primary</option>
                  <option value="RETAIL">Retail</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="ASSEMBLY">Assembly</option>
                  <option value="EXPORT">Export</option>
                </select>
                <input placeholder="Latitude" type="number" step="any" value={newMarket.latitude} onChange={(e) => setNewMarket({ ...newMarket, latitude: e.target.value })} required className="px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="Longitude" type="number" step="any" value={newMarket.longitude} onChange={(e) => setNewMarket({ ...newMarket, longitude: e.target.value })} required className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium">Add Market</button>
            </form>
          </div>
        )}

        {tab === 'prices' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Price Observations ({prices.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              {prices.slice(0, 12).map((p: any) => (
                <div key={p.id} className="p-3 bg-gray-50 rounded-lg border">
                  <p className="font-medium text-sm">{p.crop?.name} @ {p.market?.name}</p>
                  <p className="text-primary-700 font-bold">{p.pricePerKg} ETB/kg</p>
                  <p className="text-xs text-gray-500">{p.verificationStatus === 'VERIFIED' ? '✓ Verified' : p.verificationStatus || 'Unverified'} • {new Date(p.observationDate).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
            <form onSubmit={addPrice} className="space-y-3 border-t pt-4">
              <h3 className="font-medium text-sm">Record New Price</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select value={newPrice.cropId} onChange={(e) => setNewPrice({ ...newPrice, cropId: e.target.value })} required
                  className="px-3 py-2 border rounded-lg text-sm">
                  <option value="">Crop</option>
                  {crops.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={newPrice.marketId} onChange={(e) => setNewPrice({ ...newPrice, marketId: e.target.value })} required
                  className="px-3 py-2 border rounded-lg text-sm">
                  <option value="">Market</option>
                  {markets.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <input placeholder="Grade (optional)" value={newPrice.grade} onChange={(e) => setNewPrice({ ...newPrice, grade: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-sm" />
                <input type="number" step="any" placeholder="Price per kg (ETB)" value={newPrice.pricePerKg}
                  onChange={(e) => setNewPrice({ ...newPrice, pricePerKg: e.target.value })} required
                  className="px-3 py-2 border rounded-lg text-sm" />
                <input type="date" value={newPrice.observationDate} onChange={(e) => setNewPrice({ ...newPrice, observationDate: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-sm" />
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium">Record Price</button>
              </div>
            </form>
          </div>
        )}

        {tab === 'crops' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Crops</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {crops.map((c: any) => (
                <span key={c.id} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm border border-primary-100">
                  {c.name}{c.nameOm ? ` (${c.nameOm})` : ''}
                </span>
              ))}
            </div>
            <form onSubmit={addCrop} className="space-y-3 border-t pt-4">
              <h3 className="font-medium text-sm">Create Crop</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input placeholder="English name" value={newCrop.name} onChange={(e) => setNewCrop({ ...newCrop, name: e.target.value })} required
                  className="px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="Afaan Oromoo name" value={newCrop.nameOm} onChange={(e) => setNewCrop({ ...newCrop, nameOm: e.target.value })} required
                  className="px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="Category (e.g. Grain)" value={newCrop.category} onChange={(e) => setNewCrop({ ...newCrop, category: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium">Add Crop</button>
            </form>
          </div>
        )}

        {tab === 'rates' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Transport Rates</h2>
            <p className="text-xs text-gray-500 mb-4">
              Cost model: transport = distance (km) × rate per km per ton × quantity (tons). The most recent rate is used in recommendations.
            </p>
            <div className="space-y-2 mb-6">
              {rates.length === 0 && <p className="text-sm text-gray-400">No rates yet.</p>}
              {rates.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border text-sm">
                  <div>
                    <span className="font-medium">{r.routeType} / {r.vehicleType}</span>
                    <span className="text-xs text-gray-500 ml-2">from {new Date(r.effectiveDate).toLocaleDateString()}</span>
                  </div>
                  <span className="font-bold text-primary-700">{r.ratePerKmPerTon} ETB/km/ton</span>
                </div>
              ))}
            </div>
            <form onSubmit={addRate} className="grid grid-cols-1 sm:grid-cols-4 gap-3 border-t pt-4">
              <input placeholder="Route type (e.g. general)" value={newRate.routeType} onChange={(e) => setNewRate({ ...newRate, routeType: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Vehicle type (e.g. truck-5ton)" value={newRate.vehicleType} onChange={(e) => setNewRate({ ...newRate, vehicleType: e.target.value })} required
                className="px-3 py-2 border rounded-lg text-sm" />
              <input type="number" step="any" placeholder="ETB/km/ton" value={newRate.ratePerKmPerTon}
                onChange={(e) => setNewRate({ ...newRate, ratePerKmPerTon: e.target.value })} required
                className="px-3 py-2 border rounded-lg text-sm" />
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium">Add Rate</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}