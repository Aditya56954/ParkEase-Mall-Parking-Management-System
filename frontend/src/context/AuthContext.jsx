import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('parkease_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('parkease_user');
    return raw ? JSON.parse(raw) : null;
  });

  const persist = (t, u) => {
    if (t) localStorage.setItem('parkease_token', t);
    if (u) localStorage.setItem('parkease_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    persist(res.data.token, res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    const res = await api.post('/auth/register', { name, email, password, role });
    persist(res.data.token, res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('parkease_token');
    localStorage.removeItem('parkease_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
