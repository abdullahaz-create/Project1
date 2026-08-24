import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [role, setRole] = useState(() => localStorage.getItem('role'));
  const [loading, setLoading] = useState(false);

  const isAdmin = role === 'admin';
  const isLoggedIn = Boolean(token);

  const login = async (password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { password });
      const { token: newToken, role: newRole } = res.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('role', newRole);
      setToken(newToken);
      setRole(newRole);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, isAdmin, isLoggedIn, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
