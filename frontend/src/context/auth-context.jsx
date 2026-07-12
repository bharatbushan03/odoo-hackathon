import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, clearToken, getToken, setToken } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return null;
    }
    const profile = await authApi.me();
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (getToken()) await refreshUser();
      } catch {
        if (active) logout();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [logout, refreshUser]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    setToken(data.token);
    setUser({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      departmentId: data.departmentId,
    });
    return data;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const data = await authApi.signup(name, email, password);
    setToken(data.token);
    setUser({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      departmentId: data.departmentId,
    });
    return data;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, refreshUser, isAuthenticated: !!user }),
    [user, loading, login, signup, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
