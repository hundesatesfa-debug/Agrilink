'use client';

import Link from 'next/link';
import { useAuth, roleDisplayName } from '@/lib/auth-context';
import { useTranslation } from '@/hooks/useTranslation';
import Navbar from '@/components/Navbar';
import { Target, TrendingUp, Users, Truck, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-2xl">AL</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('app.name')}</h1>
          <p className="text-xl text-gray-600 mb-8">{t('app.subtitle')}</p>
          <p className="text-gray-500 mb-12 max-w-2xl mx-auto">
            AgriLink connects farmers, buyers, and transporters across Jimma Zone with real market intelligence.
            Find the best market for your crops and maximize your earnings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="px-8 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors inline-flex items-center justify-center space-x-2">
              <span>{t('auth.register')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              {t('auth.login')}
            </Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: t('home.whereToSell'), desc: t('home.whereToSellDesc') },
              { icon: TrendingUp, title: t('home.marketPrices'), desc: t('home.marketPricesDesc') },
              { icon: Truck, title: t('home.findTransport'), desc: t('home.findTransportDesc') },
            ].map((f) => (
              <div key={f.title} className="bg-white p-6 rounded-xl shadow-sm border text-center">
                <f.icon className="w-10 h-10 text-primary-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const roleHome: Record<string, string> = {
    FARMER: '/dashboard',
    BUYER: '/dashboard',
    TRANSPORTER: '/dashboard',
    ADMIN: '/admin',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {roleDisplayName(user)}!</h1>
          <p className="text-gray-500">What would you like to do today?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { href: '/recommend', icon: Target, label: t('home.whereToSell'), desc: t('home.whereToSellDesc') },
            { href: '/markets', icon: TrendingUp, label: t('home.marketPrices'), desc: t('home.marketPricesDesc') },
            { href: '/buyers', icon: Users, label: t('home.findBuyers'), desc: t('home.findBuyersDesc') },
            { href: '/transport', icon: Truck, label: t('home.findTransport'), desc: t('home.findTransportDesc') },
          ].map((action) => (
            <Link key={action.href} href={action.href}
              className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow text-center group">
              <action.icon className="w-10 h-10 text-primary-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1">{action.label}</h3>
              <p className="text-xs text-gray-500">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}