'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { MapPin, Navigation } from 'lucide-react';

export default function MapPage() {
  const { token } = useAuth();
  const [markets, setMarkets] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [farmerLat, setFarmerLat] = useState(7.6789);
  const [farmerLon, setFarmerLon] = useState(36.8340);
  const [selectedCrop, setSelectedCrop] = useState('');

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiClient.get('/markets', token).then(setMarkets).catch(() => []),
      apiClient.get('/prices', token).then(setPrices).catch(() => []),
      apiClient.get('/crops', token).then(setCrops).catch(() => []),
    ]);
  }, [token]);

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const priceFor = (marketId: number) => {
    const filtered = selectedCrop ? prices.filter((p: any) => String(p.cropId) === selectedCrop) : prices;
    return filtered.find((p) => p.marketId === marketId) || null;
  };

  const latBounds = { min: 6.5, max: 10 };
  const lonBounds = { min: 35.5, max: 39.5 };

  const xOf = (lon: number) => ((lon - lonBounds.min) / (lonBounds.max - lonBounds.min)) * 100;
  const yOf = (lat: number) => 100 - ((lat - latBounds.min) / (latBounds.max - latBounds.min)) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
          <MapPin className="w-6 h-6 text-primary-600" />
          <span>Markets Map</span>
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Simplified map of markets around Jimma Zone. Distances shown are straight-line estimates.
          Click each marker for price and distance details.
        </p>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium">Farmer location (editable):</span>
            <input type="number" step="any" value={farmerLat} onChange={(e) => setFarmerLat(parseFloat(e.target.value))}
              className="px-2 py-1 border rounded-lg text-sm w-28" />
            <input type="number" step="any" value={farmerLon} onChange={(e) => setFarmerLon(parseFloat(e.target.value))}
              className="px-2 py-1 border rounded-lg text-sm w-28" />
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium">Filter by crop:</span>
            <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}
              className="px-2 py-1 border rounded-lg text-sm">
              <option value="">All crops</option>
              {crops.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 overflow-hidden">
          <div className="relative w-full" style={{ height: 480 }}>
            {/* grid lines */}
            {[20, 40, 60, 80].map((v) => (
              <div key={`v${v}`} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: `${v}%` }} />
            ))}
            {[20, 40, 60, 80].map((v) => (
              <div key={`h${v}`} className="absolute top-0 bottom-0 border-l border-gray-100" style={{ left: `${v}%` }} />
            ))}

            {/* farmer marker */}
            <div className="absolute transform -translate-x-1/2 -translate-y-full"
              style={{ left: `${xOf(farmerLon)}%`, top: `${yOf(farmerLat)}%` }}>
              <div className="relative flex flex-col items-center">
                <div className="p-1.5 rounded-full bg-red-600 text-white border-4 border-red-200">
                  <Navigation className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold bg-white px-2 py-0.5 rounded shadow mt-1">You</span>
              </div>
            </div>

            {/* market markers */}
            {markets.map((m: any) => {
              const p = priceFor(m.id);
              const dist = haversine(farmerLat, farmerLon, m.latitude, m.longitude);
              return (
                <div key={m.id} className="absolute transform -translate-x-1/2 -translate-y-full"
                  style={{ left: `${xOf(m.longitude)}%`, top: `${yOf(m.latitude)}%` }}>
                  <div className="relative flex flex-col items-center group cursor-pointer">
                    <div className="p-1.5 rounded-full bg-primary-600 text-white border-4 border-primary-200">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold bg-white px-2 py-0.5 rounded shadow mt-1 group-hover:bg-primary-50">
                      {m.name}
                    </span>
                    <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-3 w-48 z-10 hidden group-hover:block">
                      <p className="font-bold text-sm">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.city}</p>
                      {p ? (
                        <>
                          <p className="text-sm font-semibold text-primary-700 mt-2">{p.pricePerKg} ETB/kg ({p.crop?.name})</p>
                          <p className="text-xs text-gray-500">Verified: {p.verificationStatus === 'VERIFIED' ? 'Yes' : 'No'}</p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400 mt-2">No price data</p>
                      )}
                      <p className="text-xs text-gray-600 mt-2">≈ {Math.round(dist)} km away</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold text-sm mb-3">Market list</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {markets.map((m: any) => {
              const p = priceFor(m.id);
              const dist = haversine(farmerLat, farmerLon, m.latitude, m.longitude);
              return (
                <div key={m.id} className="p-3 bg-gray-50 rounded-lg border text-sm">
                  <p className="font-bold">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.city} • ≈ {Math.round(dist)} km</p>
                  {p && <p className="text-primary-700 font-semibold mt-1">{p.pricePerKg} ETB/kg — {p.crop?.name}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}