import { AuthResponse, LoginCredentials } from '../types';
import api from './api';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse & { fingerprint: string }> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async register(username: string, emojiPattern: string): Promise<AuthResponse & { fingerprint: string }> {
    const response = await api.post('/auth/register', {
      username,
      emojiPattern
    });
    return response.data;
  },

  async validateToken(): Promise<AuthResponse> {
    const response = await api.get('/auth/validate');
    return response.data;
  },

  setAuthSession(token: string, fingerprint: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('fingerprint', fingerprint);
  },

  getAuthToken(): string | null {
    return localStorage.getItem('token');
  },

  getFingerprint(): string | null {
    return localStorage.getItem('fingerprint');
  },

  removeAuthSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('fingerprint');
  },

  async getUsers(): Promise<any[]> {
    const response = await api.get('/auth/users');
    return response.data;
  }
};
