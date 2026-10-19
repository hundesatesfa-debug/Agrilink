'use client';

import Link from 'next/link';
import { useAuth, roleDisplayName } from '@/lib/auth-context';
import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import { Menu, X, Globe, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = user ? [
    { href: '/dashboard', label: t('nav.home') },
    { href: '/markets', label: t('nav.markets') },
    { href: '/buyers', label: t('nav.buyers') },
    { href: '/listings', label: 'Produce' },
    { href: '/transport', label: t('nav.transport') },
    ...(user.role === 'ADMIN' ? [{ href: '/admin', label: t('nav.dashboard') }] : []),
  ] : [];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AL</span>
              </div>
              <span className="font-bold text-lg text-primary-800 hidden sm:block">{t('app.name')}</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-700 hover:bg-primary-50 transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={() => setLocale(locale === 'en' ? 'om' : 'en')}
              className="p-2 rounded-md text-gray-500 hover:text-primary-600 hover:bg-gray-100 transition-colors"
              title={locale === 'en' ? 'Afaan Oromoo' : 'English'}>
              <Globe className="w-5 h-5" />
            </button>

            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-700" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{roleDisplayName(user)}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border py-1 z-50">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b">{user.role}</div>
                    <button onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <LogOut className="w-4 h-4" />
                      <span>{t('auth.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-700">
                  {t('auth.login')}
                </Link>
                <Link href="/register" className="px-3 py-2 text-sm font-medium bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                  {t('auth.register')}
                </Link>
              </div>
            )}

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-700 hover:bg-primary-50">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
