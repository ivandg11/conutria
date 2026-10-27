import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { AuthContext } from './useAuth';


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutInProgressRef = useRef(false);

  const clearLocalSession = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    api.get('/auth/me').then((res) => {
      if (!logoutInProgressRef.current) setUser(res.data);
    }).catch(() => {
      if (!logoutInProgressRef.current) setUser(null);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const expiration = user?.subscription?.renewsAt;
    if (!user || user.role === 'SUPERADMIN' || user.hasAccess === false || user.subscription?.isLifetime || !expiration) return undefined;
    let retryTimer;
    const checkAccess = async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (!logoutInProgressRef.current) setUser(data);
      } catch {
        // A temporary API failure does not mean the subscription has expired.
        retryTimer = window.setTimeout(checkAccess, 30 * 1000);
      }
    };
    const delay = new Date(expiration).getTime() - Date.now();
    if (delay <= 0) {
      checkAccess();
      return () => window.clearTimeout(retryTimer);
    }
    const timer = window.setTimeout(checkAccess, delay + 250);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(retryTimer);
    };
  }, [user]);

  async function login(email, password) {
    await api.post('/auth/login', { email, password });
    const { data } = await api.get('/auth/me');
    setUser(data);
    return data;
  }

  async function logout() {
    logoutInProgressRef.current = true;
    clearLocalSession();
    try { await api.post('/auth/logout'); } catch { /* The local session is already cleared. */ }
    window.location.replace('/login');
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>{children}</AuthContext.Provider>;
}
