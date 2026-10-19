'use client';
import { useState } from 'react';
import { t, Locale } from '@/lib/translations';

export function useTranslation() {
  const [locale, setLocale] = useState<Locale>(
    (typeof window !== 'undefined' && (localStorage.getItem('agrilink_locale') as Locale)) || 'en'
  );

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    if (typeof window !== 'undefined') localStorage.setItem('agrilink_locale', newLocale);
  };

  return { locale, setLocale: changeLocale, t: (key: string, params?: Record<string, string | number>) => t(key, locale, params) };
}
