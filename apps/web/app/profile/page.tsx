'use client';

import { useEffect, useState } from 'react';
import { useAuth, roleDisplayName } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { User as UserIcon, AlertCircle, Truck } from 'lucide-react';

const ENDPOINTS: Record<string, { get: string; put: string }> = {
  FARMER: { get: '/farmers/me', put: '/farmers/me' },
  BUYER: { get: '/buyers/me', put: '/buyers/me' },
  TRANSPORTER: { get: '/transporters/me', put: '/transporters/me' },
};

export default function ProfilePage() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleForm, setVehicleForm] = useState({ type: '', plateNumber: '', capacityKg: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token || !ENDPOINTS[user.role]) return;
    apiClient.get(ENDPOINTS[user.role].get, token)
      .then((p: any) => {
        setProfile(p);
        if (user.role === 'FARMER') {
          setForm({
            name: p.name || '', cooperative: p.cooperative || '', location: p.location || '',
            woreda: p.woreda || '', kebele: p.kebele || '',
            latitude: p.latitude ?? '', longitude: p.longitude ?? '',
          });
        } else if (user.role === 'BUYER') {
          setForm({
            businessName: p.businessName || '', contactPerson: p.contactPerson || '',
            location: p.location || '', serviceArea: p.serviceArea || '',
            isCollector: p.isCollector ?? false, fee: p.fee ?? '',
          });
        } else if (user.role === 'TRANSPORTER') {
          setForm({
            name: p.name || '', serviceArea: p.serviceArea || '',
            latitude: p.latitude ?? '', longitude: p.longitude ?? '',
            available: p.available ?? true,
          });
          setVehicles(p.vehicles || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, token]);

  const upd = (f: string, v: any) => setForm((p: any) => ({ ...p, [f]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const payload: any = { ...form };
    if (payload.latitude !== '') payload.latitude = Number(payload.latitude); else delete payload.latitude;
    if (payload.longitude !== '') payload.longitude = Number(payload.longitude); else delete payload.longitude;
    if (payload.fee !== '' && payload.fee != null) payload.fee = Number(payload.fee); else delete payload.fee;
    if (payload.isCollector != null) payload.isCollector = Boolean(payload.isCollector);
    try {
      await apiClient.put(ENDPOINTS[user.role].put, payload, token);
      setSuccess('Profile updated!');
    } catch (err: any) {
      setError(err.message || 'Update failed');
    }
  };

  const addVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await apiClient.post('/transporters/me/vehicles', {
        type: vehicleForm.type,
        plateNumber: vehicleForm.plateNumber,
        capacityKg: parseFloat(vehicleForm.capacityKg),
      }, token);
      setVehicleForm({ type: '', plateNumber: '', capacityKg: '' });
      if (token) {
        apiClient.get('/transporters/me', token).then((p: any) => setVehicles(p.vehicles || []));
      }
      setSuccess('Vehicle added!');
    } catch (err: any) {
      setError(err.message || 'Failed to add vehicle');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
          <UserIcon className="w-6 h-6 text-primary-600" />
          <span>My Profile</span>
        </h1>

        {error && <div className="mb-4 p-3 bg-red-50 border rounded-lg text-red-700 text-sm flex items-center space-x-2"><AlertCircle className="w-4 h-4" /><span>{error}</span></div>}
        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="font-semibold mb-3">Account</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-gray-500">Name</p><p className="font-medium">{roleDisplayName(user)}</p></div>
            <div><p className="text-xs text-gray-500">Phone</p><p className="font-medium">{user.phone}</p></div>
            <div><p className="text-xs text-gray-500">Role</p><p className="font-medium">{user.role}</p></div>
            <div><p className="text-xs text-gray-500">Language</p><p className="font-medium">{user.preferredLanguage}</p></div>
          </div>
        </div>

        {loading && <div className="bg-white rounded-xl border p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>}

        {user.role === 'FARMER' && form && (
          <form onSubmit={save} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h2 className="font-semibold">Farmer Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Name" value={form.name || ''} onChange={(e) => upd('name', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Cooperative" value={form.cooperative || ''} onChange={(e) => upd('cooperative', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Location (e.g. Mana)" value={form.location || ''} onChange={(e) => upd('location', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Woreda" value={form.woreda || ''} onChange={(e) => upd('woreda', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Kebele" value={form.kebele || ''} onChange={(e) => upd('kebele', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
              <input type="number" step="any" placeholder="Latitude" value={form.latitude || ''} onChange={(e) => upd('latitude', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
              <input type="number" step="any" placeholder="Longitude" value={form.longitude || ''} onChange={(e) => upd('longitude', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
            </div>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium">{user.preferredLanguage === 'OM' ? "Olkaa'i" : 'Save'}</button>
          </form>
        )}

        {user.role === 'BUYER' && form && (
          <form onSubmit={save} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h2 className="font-semibold">Buyer Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Business name" value={form.businessName || ''} onChange={(e) => upd('businessName', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Contact person" value={form.contactPerson || ''} onChange={(e) => upd('contactPerson', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Location" value={form.location || ''} onChange={(e) => upd('location', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Service area" value={form.serviceArea || ''} onChange={(e) => upd('serviceArea', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
              <input type="number" step="any" placeholder="Service fee (ETB)" value={form.fee ?? ''} onChange={(e) => upd('fee', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
            </div>
            <label className="flex items-center space-x-2 text-sm">
              <input type="checkbox" checked={Boolean(form.isCollector)} onChange={(e) => upd('isCollector', e.target.checked)} />
              <span>I am a collector (buys in bulk from smallholders)</span>
            </label>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium">{user.preferredLanguage === 'OM' ? "Olkaa'i" : 'Save'}</button>
          </form>
        )}

        {user.role === 'TRANSPORTER' && (
          <>
            <form onSubmit={save} className="bg-white rounded-xl shadow-sm border p-6 space-y-4 mb-6">
              <h2 className="font-semibold">Transporter Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="Name" value={form.name || ''} onChange={(e) => upd('name', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="Service area" value={form.serviceArea || ''} onChange={(e) => upd('serviceArea', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
                <input type="number" step="any" placeholder="Latitude" value={form.latitude || ''} onChange={(e) => upd('latitude', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
                <input type="number" step="any" placeholder="Longitude" value={form.longitude || ''} onChange={(e) => upd('longitude', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <label className="flex items-center space-x-2 text-sm">
                <input type="checkbox" checked={Boolean(form.available)} onChange={(e) => upd('available', e.target.checked)} />
                <span>Available for jobs</span>
              </label>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium">{user.preferredLanguage === 'OM' ? "Olkaa'i" : 'Save'}</button>
            </form>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold mb-3 flex items-center space-x-2">
                <Truck className="w-4 h-4 text-purple-600" />
                <span>My Vehicles</span>
              </h2>
              <div className="space-y-2 mb-4">
                {vehicles.length === 0 && <p className="text-sm text-gray-400">No vehicles yet.</p>}
                {vehicles.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border text-sm">
                    <span className="font-medium">{v.type}</span>
                    <span className="text-gray-600">{v.plateNumber} • {Number(v.capacityKg || 0).toLocaleString()} kg</span>
                  </div>
                ))}
              </div>
              <form onSubmit={addVehicle} className="grid grid-cols-1 sm:grid-cols-4 gap-3 border-t pt-4">
                <input placeholder="Vehicle type (e.g. Isuzu)" value={vehicleForm.type} onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })} required className="px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="Plate number" value={vehicleForm.plateNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                <input type="number" placeholder="Capacity kg" value={vehicleForm.capacityKg} onChange={(e) => setVehicleForm({ ...vehicleForm, capacityKg: e.target.value })} required className="px-3 py-2 border rounded-lg text-sm" />
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">Add Vehicle</button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}