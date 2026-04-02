import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.js';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = authService.getAuthToken();
      if (token) {
        try {
          const response = await authService.validateToken();
          setUser(response.user);
        } catch (error) {
          authService.removeAuthSession();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, emojiPattern) => {
    try {
      const response = await authService.login({ username, emojiPattern });
      authService.setAuthSession(response.token, response.fingerprint);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (username, emojiPattern) => {
    try {
      const response = await authService.register(username, emojiPattern);
      authService.setAuthSession(response.token, response.fingerprint);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.removeAuthSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
