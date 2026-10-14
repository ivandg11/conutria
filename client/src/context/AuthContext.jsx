import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me').then((res) => setUser(res.data)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data);
    return res.data;
  }

  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>{children}</AuthContext.Provider>;
}