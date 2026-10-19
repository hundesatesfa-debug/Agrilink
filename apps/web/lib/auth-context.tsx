'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from './api';

export const roleDisplayName = (user: any): string => {
  if (!user) return '';
  const p = user.profile;
  if (user.role === 'FARMER') return p?.name || user.phone;
  if (user.role === 'BUYER') return p?.businessName || user.phone;
  if (user.role === 'TRANSPORTER') return p?.name || user.phone;
  return 'Administrator';
};

interface AuthContextType {
  user: any;
  token: string | null;
  login: (phone: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('agrilink_token') : null;
    if (savedToken) {
      setToken(savedToken);
      apiClient.get('/auth/me', savedToken)
        .then((data) => setUser(data))
        .catch(() => {
          localStorage.removeItem('agrilink_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (phone: string, password: string) => {
    const result = await apiClient.post('/auth/login', { phone, password });
    localStorage.setItem('agrilink_token', result.accessToken);
    setToken(result.accessToken);
    setUser(result.user);
    return result;
  };

  const register = async (data: any) => {
    const result = await apiClient.post('/auth/register', data);
    localStorage.setItem('agrilink_token', result.accessToken);
    setToken(result.accessToken);
    setUser(result.user);
    return result;
  };

  const logout = () => {
    localStorage.removeItem('agrilink_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);