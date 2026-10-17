import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { AuthContext } from './useAuth';

const IDLE_LIMIT = 10 * 60 * 1000;
const REFRESH_THROTTLE = 4 * 60 * 1000;
const ACTIVITY_KEY = 'conutria.lastActivity';
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastRefreshRef = useRef(0);
  const lastBroadcastRef = useRef(0);
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
    const checkAccess = async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (!logoutInProgressRef.current) setUser(data);
      } catch {
        setUser((current) => current ? { ...current, hasAccess: false } : current);
      }
    };
    const delay = new Date(expiration).getTime() - Date.now();
    if (delay <= 0) {
      checkAccess();
      return undefined;
    }
    const timer = window.setTimeout(checkAccess, delay + 250);
    return () => window.clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    let idleTimer;
    const resetTimer = (recordActivity = true) => {
      const now = Date.now();
      let sharedActivity;
      try {
        if (recordActivity && now - lastBroadcastRef.current >= 2000) {
          localStorage.setItem(ACTIVITY_KEY, String(now));
          lastBroadcastRef.current = now;
        }
        sharedActivity = Number(localStorage.getItem(ACTIVITY_KEY));
      } catch { /* The local inactivity timer still works when storage is unavailable. */ }
      const lastActivity = sharedActivity || now;
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        clearLocalSession();
        api.post('/auth/logout').catch(() => {});
        window.location.assign('/login?expired=1');
      }, Math.max(0, IDLE_LIMIT - (now - lastActivity)));
      if (recordActivity && now - lastRefreshRef.current >= REFRESH_THROTTLE) {
        lastRefreshRef.current = now;
        api.post('/auth/session/refresh').catch(() => {
          clearLocalSession();
          window.location.assign('/login?expired=1');
        });
      }
    };
    const onStorage = (event) => {
      if (event.key === ACTIVITY_KEY) resetTimer(false);
    };
    const onActivity = () => resetTimer();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    window.addEventListener('storage', onStorage);
    resetTimer();
    return () => {
      window.clearTimeout(idleTimer);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
      window.removeEventListener('storage', onStorage);
    };
  }, [user, clearLocalSession]);

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
