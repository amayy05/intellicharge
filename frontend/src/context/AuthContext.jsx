import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, fetchMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('intellicharge_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('intellicharge_token') || null;
  });

  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  // Validate and refresh session on mount
  useEffect(() => {
    async function verifySession() {
      if (token) {
        try {
          const freshUser = await fetchMe();
          setUser(freshUser);
          localStorage.setItem('intellicharge_user', JSON.stringify(freshUser));
        } catch (err) {
          console.warn('Session verification failed, logging out:', err);
          logout();
        }
      }
      setLoading(false);
    }
    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('intellicharge_token', data.access_token);
    localStorage.setItem('intellicharge_user', JSON.stringify(data.user));
    setIsAuthModalOpen(false);
    return data.user;
  };

  const register = async (email, password, name = '') => {
    const data = await registerUser(email, password, name);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('intellicharge_token', data.access_token);
    localStorage.setItem('intellicharge_user', JSON.stringify(data.user));
    setIsAuthModalOpen(false);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('intellicharge_token');
    localStorage.removeItem('intellicharge_user');
  };

  const openLoginModal = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalMode('register');
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    register,
    logout,
    isAuthModalOpen,
    authModalMode,
    openLoginModal,
    openRegisterModal,
    closeAuthModal,
    setAuthModalMode,
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
