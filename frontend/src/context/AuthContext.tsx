import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, emojiPattern: string) => Promise<any>;
  register: (username: string, emojiPattern: string) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
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

  const login = async (username: string, emojiPattern: string) => {
    try {
      const response = await authService.login({ username, emojiPattern });
      authService.setAuthSession(response.token, response.fingerprint);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, emojiPattern: string) => {
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
