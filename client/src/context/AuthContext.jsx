import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true); // true until initial check completes

  // ── Auto-login on mount: check stored token ───────────
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const { data } = await API.get('/user');
          if (data.success) {
            setUser(data.user);
            setToken(storedToken);
          }
        } catch (err) {
          // Token invalid/expired — clear it
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // ── Login ─────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await API.post('/login', { email, password });
    if (data.success) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  // ── Register ──────────────────────────────────────────
  const register = async (name, email, password) => {
    const { data } = await API.post('/register', { name, email, password });
    if (data.success) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  // ── Logout ────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // ── Refresh user data from server ─────────────────────
  const refreshUser = async () => {
    try {
      const { data } = await API.get('/user');
      if (data.success) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
