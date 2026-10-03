import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Synchronize and verify current user on mount or token change
  useEffect(() => {
    let isMounted = true;

    async function verifyUser() {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (isMounted) {
          setUser(response.data.user);
          setToken(storedToken);
        }
      } catch (err) {
        console.warn('[Auth] Session validation failed:', err.response?.data?.message || err.message);
        if (isMounted) {
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    verifyUser();

    // Listen for global unauthorized events dispatched by Axios interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  /**
   * Logs in user, saves token, and returns authenticated profile.
   */
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: authenticatedUser } = response.data;
    localStorage.setItem('token', receivedToken);
    setToken(receivedToken);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  /**
   * Registers a new citizen account.
   */
  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  };

  /**
   * Clears token and resets user session.
   */
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
