'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/hooks/useTranslation';
import { apiClient } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { Truck, PlusCircle, PackageCheck, MapPin } from 'lucide-react';

const REQUEST_BADGES: Record<string, string> = {
  REQUESTED: 'bg-blue-100 text-blue-700',
  MATCHED: 'bg-purple-100 text-purple-700',
  ACCEPTED: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
  COMPLETED: 'bg-green-100 text-green-700',
};

const SHIPMENT_BADGES: Record<string, string> = {
  REQUESTED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-purple-100 text-purple-700',
  IN_TRANSIT: 'bg-amber-100 text-amber-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function TransportPage() {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const [transporters, setTransporters] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [openRequests, setOpenRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({
    cropId: '', quantity: '', pickupLabel: '', destLabel: '', destMarketId: '',
    pickupLat: '7.5872', pickupLng: '36.8209', preferredDate: '',
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadRequests = () => {
    if (!token) return;
    apiClient.get('/transport-requests/mine', token).then(setMyRequests).catch(() => setMyRequests([]));
    if (user?.role === 'TRANSPORTER') {
      apiClient.get('/transport-requests', token).then(setOpenRequests).catch(() => setOpenRequests([]));
    }
  };

  useEffect(() => {
    if (!token || !user) return;
    Promise.all([
      apiClient.get('/transporters', token).catch(() => []),
      apiClient.get('/crops', token).catch(() => []),
      apiClient.get('/markets', token).catch(() => []),
    ]).then(([tr, cr, mk]) => {
      setTransporters(tr);
      setCrops(cr);
      setMarkets(mk);
    }).finally(() => setLoading(false));
    loadRequests();
  }, [token, user]);

  const upd = (f: string, v: string) => setForm((prev: any) => ({ ...prev, [f]: v }));

  const handleMarketSelect = (id: string) => {
    const market = markets.find((m: any) => String(m.id) === id);
    upd('destMarketId', id);
    if (market) {
      upd('destLat', String(market.latitude));
      upd('destLng', String(market.longitude));
      upd('destLabel', `${market.name}, ${market.city}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    try {
      await apiClient.post('/transport-requests', {
        cropId: Number(form.cropId),
        quantity: parseFloat(form.quantity),
        pickupLat: parseFloat(form.pickupLat),
        pickupLng: parseFloat(form.pickupLng),
        pickupLabel: form.pickupLabel,
        destLat: parseFloat(form.destLat),
        destLng: parseFloat(form.destLng),
        destLabel: form.destLabel,
        preferredDate: form.preferredDate || undefined,
      }, token);
      setFormSuccess('Transport request created!');
      setForm({ cropId: '', quantity: '', pickupLabel: '', destLabel: '', destMarketId: '', pickupLat: '7.5872', pickupLng: '36.8209', preferredDate: '' });
      setShowForm(false);
      loadRequests();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create request');
    }
  };

  const respond = async (id: number, accept: boolean) => {
    try {
      await apiClient.put(`/transport-requests/${id}/${accept ? 'accept' : 'reject'}`, {}, token);
      loadRequests();
    } catch {}
  };

  const updateShipment = async (shipmentId: number, status: string) => {
    try {
      await apiClient.put(`/transport-requests/shipments/${shipmentId}/status`, { status }, token);
      loadRequests();
    } catch {}
  };

  const nextShipmentAction = (shipment: any) => {
    const s = shipment?.status;
    if (s === 'REQUESTED') return { label: 'Confirm pickup', next: 'CONFIRMED' };
    if (s === 'CONFIRMED') return { label: 'Start trip', next: 'IN_TRANSIT' };
    if (s === 'IN_TRANSIT') return { label: 'Mark delivered', next: 'DELIVERED' };
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Truck className="w-6 h-6 text-purple-600" />
            <span>{t('home.findTransport')}</span>
          </h1>
          {(user?.role === 'FARMER' || user?.role === 'BUYER') && (
            <button onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center space-x-2 text-sm">
              <PlusCircle className="w-4 h-4" />
              <span>Request Transport</span>
            </button>
          )}
        </div>
        <p className="text-gray-500 text-sm mb-6">Available transporters and your transport requests.</p>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 mb-8 space-y-4">
            <h2 className="font-semibold">New Transport Request</h2>
            {formError && <p className="text-red-600 text-sm">{formError}</p>}
            {formSuccess && <p className="text-green-600 text-sm">{formSuccess}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
                <select value={form.cropId} onChange={(e) => upd('cropId', e.target.value)} required
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="">-- Select --</option>
                  {crops.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
                <input type="number" min={1} value={form.quantity} onChange={(e) => upd('quantity', e.target.value)} required
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred date</label>
                <input type="date" value={form.preferredDate} onChange={(e) => upd('preferredDate', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup label</label>
                <input type="text" value={form.pickupLabel} onChange={(e) => upd('pickupLabel', e.target.value)} required
                  placeholder="e.g. Village, Mana (coords default to Mana)" className="w-full px-3 py-2 border rounded-lg" />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input type="number" step="any" placeholder="Pickup lat" value={form.pickupLat} onChange={(e) => upd('pickupLat', e.target.value)} required
                    className="px-3 py-2 border rounded-lg text-sm" />
                  <input type="number" step="any" placeholder="Pickup lng" value={form.pickupLng} onChange={(e) => upd('pickupLng', e.target.value)} required
                    className="px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <select value={form.destMarketId} onChange={(e) => handleMarketSelect(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">-- Pick a market, or type below --</option>
                  {markets.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.city})</option>)}
                </select>
                <input type="text" value={form.destLabel} onChange={(e) => upd('destLabel', e.target.value)} required
                  placeholder="Destination label, e.g. Nekemte Market"
                  className="w-full px-3 py-2 border rounded-lg" />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input type="number" step="any" placeholder="Dest lat" value={form.destLat || ''} onChange={(e) => upd('destLat', e.target.value)} required
                    className="px-3 py-2 border rounded-lg text-sm" />
                  <input type="number" step="any" placeholder="Dest lng" value={form.destLng || ''} onChange={(e) => upd('destLng', e.target.value)} required
                    className="px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
            </div>
            <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">
              Create Request
            </button>
          </form>
        )}

        {user?.role === 'TRANSPORTER' && openRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <PackageCheck className="w-5 h-5 text-purple-600" />
              <span>Available loads awaiting a transporter</span>
            </h2>
            <div className="space-y-3">
              {openRequests.map((r: any) => (
                <div key={r.id} className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{r.crop?.name} — {Number(r.quantity || 0).toLocaleString()} kg</p>
                    <p className="text-xs text-gray-500 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>{r.pickupLabel || 'Pickup'} → {r.destLabel || 'Destination'}</span>
                    </p>
                    {r.distanceKm != null && <p className="text-xs text-gray-400 mt-0.5">≈ {r.distanceKm} km • est. {r.estimatedPrice ? `${r.estimatedPrice.toLocaleString()} ETB` : ''}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${REQUEST_BADGES[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                    <button onClick={() => respond(r.id, true)}
                      className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Accept</button>
                    <button onClick={() => respond(r.id, false)}
                      className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Decline</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {myRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <PackageCheck className="w-5 h-5 text-primary-600" />
              <span>My Transport Requests</span>
            </h2>
            <div className="bg-white rounded-xl shadow-sm border divide-y">
              {myRequests.map((r: any) => {
                const nextAction = nextShipmentAction(r.shipment);
                return (
                  <div key={r.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{r.crop?.name} — {Number(r.quantity || 0).toLocaleString()} {r.unit || 'kg'}</p>
                      <p className="text-xs text-gray-500">{r.pickupLabel || 'Pickup'} → {r.destLabel || 'Destination'}</p>
                      {r.estimatedPrice != null && <p className="text-xs text-gray-400 mt-0.5">est. {r.estimatedPrice.toLocaleString()} ETB</p>}
                      {r.shipment?.trackingRef && <p className="text-xs text-gray-400">Ref: {r.shipment.trackingRef}</p>}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${REQUEST_BADGES[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                      {r.shipment && (
                        <span className={`text-xs px-2 py-1 rounded-full ${SHIPMENT_BADGES[r.shipment.status] || 'bg-gray-100 text-gray-600'}`}>
                          shipment: {r.shipment.status}
                        </span>
                      )}
                      {nextAction && user?.role === 'TRANSPORTER' && (
                        <button onClick={() => updateShipment(r.shipment.id, nextAction.next)}
                          className="text-xs px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700">
                          {nextAction.label}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <h2 className="font-semibold text-gray-900 mb-3">Available Transporters</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : transporters.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border">
            <p className="text-gray-500">No transporters available right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {transporters.map((tr: any) => (
              <div key={tr.id} className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="font-semibold">{tr.name || `Transporter #${tr.id}`}</h3>
                <p className="text-xs text-gray-500 mb-3">{tr.serviceArea || 'Service area not set'}</p>
                <div className="space-y-2 text-sm">
                  {(tr.vehicles?.length ? tr.vehicles : []).map((v: any) => (
                    <div key={v.id} className="flex justify-between bg-gray-50 rounded-lg p-2">
                      <span className="font-medium">{v.type}</span>
                      <span className="text-gray-600">{Number(v.capacityKg || 0).toLocaleString()} kg capacity</span>
                    </div>
                  ))}
                  {!tr.vehicles?.length && <p className="text-xs text-gray-400">No vehicles listed</p>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${tr.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {tr.available ? '● Available' : '○ Busy'}
                  </span>
                  <span className="text-xs text-gray-400">{tr.phone || ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}