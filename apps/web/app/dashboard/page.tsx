'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, roleDisplayName } from '@/lib/auth-context';
import { useTranslation } from '@/hooks/useTranslation';
import { apiClient } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { SkeletonCard } from '@/components/SkeletonLoader';
import Link from 'next/link';
import { Target, TrendingUp, Users, Truck, ShoppingCart, MapPin, ImagePlus } from 'lucide-react';

export default function DashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [markets, setMarkets] = useState<any[]>([]);
  const [demands, setDemands] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !token) return;
    Promise.all([
      apiClient.get('/markets', token).catch(() => []),
      apiClient.get('/buyers/demands', token).catch(() => []),
      apiClient.get('/prices?limit=30', token).catch(() => []),
    ]).then(([m, d, p]) => {
      setMarkets(m);
      setDemands(d);
      setPrices(p);
    }).finally(() => setLoading(false));
  }, [user, token]);

  if (authLoading || !user) return null;

  const quickActions = [
    { href: '/recommend', icon: Target, label: t('home.whereToSell'), color: 'bg-primary-500' },
    { href: '/markets', icon: TrendingUp, label: t('home.marketPrices'), color: 'bg-blue-500' },
    { href: '/buyers', icon: Users, label: t('home.findBuyers'), color: 'bg-amber-500' },
    ...(user.role === 'FARMER' ? [{ href: '/listings', icon: ImagePlus, label: 'Post produce', color: 'bg-green-600' }] : []),
    { href: '/transport', icon: Truck, label: t('home.findTransport'), color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t('nav.home')}, {roleDisplayName(user)}!
        </h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}
              className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow text-center group">
              <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              <span>Recent Prices</span>
            </h2>
            {loading ? (
              <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
            ) : prices.length === 0 ? (
              <p className="text-gray-500 text-sm">{t('common.noData')}</p>
            ) : (
              <div className="space-y-2">
                {prices.slice(0, 8).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <span className="text-sm font-medium">{p.crop?.name}</span>
                      <span className="text-xs text-gray-500 ml-2">at {p.market?.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-primary-700">{p.pricePerKg} ETB/kg</span>
                      {p.verificationStatus === 'VERIFIED' && <span className="ml-1 text-xs text-green-600">✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-amber-600" />
              <span>Active Buyer Demands</span>
            </h2>
            {loading ? (
              <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
            ) : demands.length === 0 ? (
              <p className="text-gray-500 text-sm">{t('common.noData')}</p>
            ) : (
              <div className="space-y-2">
                {demands.slice(0, 6).map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <span className="text-sm font-medium">{d.crop?.name}</span>
                      <span className="text-xs text-gray-500 block">{d.buyer?.businessName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{Number(d.quantity || 0).toLocaleString()} kg</span>
                      {d.offeredPrice != null && (
                        <span className="text-xs text-primary-600 block">{d.offeredPrice} ETB/kg</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>Active Markets ({markets.length})</span>
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {markets.map((m: any) => (
                <div key={m.id} className="p-3 bg-gray-50 rounded-lg border">
                  <h3 className="font-medium text-sm">{m.name}</h3>
                  <p className="text-xs text-gray-500">{m.city} • {m.type || 'MARKET'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}