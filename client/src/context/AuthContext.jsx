// client/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('imovies_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      id: 'usr-demo',
      name: 'Aaradhya Sharma',
      email: 'aaradhya.sharma@imovies.com',
      role: 'user'
    };
  });

  const [token, setToken] = useState(() => localStorage.getItem('imovies_token') || 'demo_token');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  useEffect(() => {
    if (user) {
      localStorage.setItem('imovies_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('imovies_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('imovies_token', token);
    } else {
      localStorage.removeItem('imovies_token');
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.user);
      setToken(res.data.token);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Invalid credentials'
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      setUser(res.data.user);
      setToken(res.data.token);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('imovies_user');
    localStorage.removeItem('imovies_token');
  };

  const demoLogin = (role = 'user') => {
    if (role === 'admin') {
      const adminUser = {
        id: 'usr-admin',
        name: 'IMovies Exhibitor Admin',
        email: 'admin@imovies.com',
        role: 'admin'
      };
      setUser(adminUser);
      setToken('admin_demo_jwt_token');
    } else {
      const demoUser = {
        id: 'usr-demo',
        name: 'Aaradhya Sharma',
        email: 'aaradhya.sharma@imovies.com',
        role: 'user'
      };
      setUser(demoUser);
      setToken('user_demo_jwt_token');
    }
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        demoLogin,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMode,
        setAuthMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
