'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { PlusCircle, Home, MapPin, AlertCircle, Sprout } from 'lucide-react';

export default function FarmsPage() {
  const { token, user } = useAuth();
  const [farms, setFarms] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCropForm, setShowCropForm] = useState<string | null>(null);
  const [activeFarm, setActiveFarm] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [farmForm, setFarmForm] = useState({ name: '', latitude: '', longitude: '', landSize: '', woreda: '', kebele: '' });
  const [cropForm, setCropForm] = useState({ cropId: '', area: '', expectedYield: '', harvestStart: '', harvestEnd: '' });

  const loadFarms = () => {
    if (!token) return;
    apiClient.get('/farms', token).then(setFarms).catch(() => []);
  };

  useEffect(() => {
    loadFarms();
    if (token) apiClient.get('/crops', token).then(setCrops).catch(() => []);
  }, [token]);

  useEffect(() => {
    if (farms.length > 0 && !loading) setLoading(false);
  }, [farms]);

  const updFarm = (f: string, v: string) => setFarmForm((p) => ({ ...p, [f]: v }));
  const updCrop = (f: string, v: string) => setCropForm((p) => ({ ...p, [f]: v }));

  const addFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await apiClient.post('/farms', {
        name: farmForm.name,
        latitude: parseFloat(farmForm.latitude),
        longitude: parseFloat(farmForm.longitude),
        landSize: farmForm.landSize ? parseFloat(farmForm.landSize) : undefined,
        woreda: farmForm.woreda,
        kebele: farmForm.kebele || undefined,
      }, token);
      setSuccess('Farm added!');
      setFarmForm({ name: '', latitude: '', longitude: '', landSize: '', woreda: '', kebele: '' });
      setShowForm(false);
      loadFarms();
    } catch (err: any) { setError(err.message || 'Failed to add farm'); }
  };

  const addCropRecord = async (farmId: string, e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await apiClient.post(`/farms/${farmId}/crops`, {
        cropId: Number(cropForm.cropId),
        area: cropForm.area ? parseFloat(cropForm.area) : undefined,
        expectedYield: parseFloat(cropForm.expectedYield),
        harvestStart: cropForm.harvestStart || undefined,
        harvestEnd: cropForm.harvestEnd || undefined,
      }, token);
      setSuccess('Crop record added!');
      setCropForm({ cropId: '', area: '', expectedYield: '', harvestStart: '', harvestEnd: '' });
      setShowCropForm(null);
      loadFarms();
    } catch (err: any) { setError(err.message || 'Failed to add crop record'); }
  };

  if (user && user.role !== 'FARMER') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <p className="text-red-600">This page is for farmers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Home className="w-6 h-6 text-primary-600" />
              <span>My Farms</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Add your farm and the crops you grow.</p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center space-x-2 text-sm">
              <PlusCircle className="w-4 h-4" />
              <span>Add Farm</span>
            </button>
          )}
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border rounded-lg text-red-700 text-sm flex items-center space-x-2"><AlertCircle className="w-4 h-4" /><span>{error}</span></div>}
        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

        {showForm && (
          <form onSubmit={addFarm} className="bg-white rounded-xl shadow-sm border p-6 mb-6 space-y-4">
            <h2 className="font-semibold">Add New Farm</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input placeholder="Farm name" value={farmForm.name} onChange={(e) => updFarm('name', e.target.value)} required
                className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Latitude (GPS)" step="any" value={farmForm.latitude} onChange={(e) => updFarm('latitude', e.target.value)} required
                className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Longitude (GPS)" step="any" value={farmForm.longitude} onChange={(e) => updFarm('longitude', e.target.value)} required
                className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Land size (hectares)" type="number" step="any" value={farmForm.landSize} onChange={(e) => updFarm('landSize', e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Woreda" value={farmForm.woreda} onChange={(e) => updFarm('woreda', e.target.value)} required
                className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Kebele (optional)" value={farmForm.kebele} onChange={(e) => updFarm('kebele', e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm" />
            </div>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium">Save Farm</button>
          </form>
        )}

        {loading && farms.length === 0 ? (
          <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="bg-white rounded-xl border p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3 mb-3" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>)}</div>
        ) : farms.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border">
            <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">You have not added any farms yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {farms.map((f: any) => (
              <div key={f.id} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">{f.name}</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {f.woreda}{f.kebele ? ` • ${f.kebele}` : ''}{f.landSize ? ` • ${f.landSize} ha` : ''}
                    </p>
                  </div>
                  <button onClick={() => { setActiveFarm(activeFarm === f.id ? null : f.id); }}
                    className="text-xs text-primary-600 font-medium hover:underline">
                    {activeFarm === f.id ? 'Hide' : 'Add crop'}
                  </button>
                </div>

                {f.crops && f.crops.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {f.crops.map((cr: any) => (
                      <div key={cr.id} className="bg-gray-50 rounded-lg border p-3">
                        <p className="font-medium text-sm flex items-center space-x-1">
                          <Sprout className="w-4 h-4 text-primary-600" />
                          <span>{cr.crop?.name}</span>
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {cr.area != null && `${cr.area} ha`}{cr.area != null && ' • '}expected {Number(cr.expectedYield || 0).toLocaleString()} kg
                        </p>
                        <p className="text-xs text-gray-500">
                          {cr.harvestStart && <>Harvest {new Date(cr.harvestStart).toLocaleDateString()} – {cr.harvestEnd ? new Date(cr.harvestEnd).toLocaleDateString() : 'TBA'}</>}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {activeFarm === f.id && (
                  <form onSubmit={(e) => addCropRecord(f.id, e)} className="mt-4 bg-primary-50/50 rounded-lg border border-primary-100 p-4 space-y-3">
                    <h3 className="font-medium text-sm">Add Crop to {f.name}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select value={cropForm.cropId} onChange={(e) => updCrop('cropId', e.target.value)} required
                        className="px-3 py-2 border rounded-lg text-sm">
                        <option value="">Crop</option>
                        {crops.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input type="number" step="any" placeholder="Area (ha)" value={cropForm.area} onChange={(e) => updCrop('area', e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm" />
                      <input type="number" placeholder="Expected yield (kg)" value={cropForm.expectedYield} onChange={(e) => updCrop('expectedYield', e.target.value)} required
                        className="px-3 py-2 border rounded-lg text-sm" />
                      <input type="date" value={cropForm.harvestStart} onChange={(e) => updCrop('harvestStart', e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm" />
                      <input type="date" value={cropForm.harvestEnd} onChange={(e) => updCrop('harvestEnd', e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm" />
                      <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium">Save Crop</button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}