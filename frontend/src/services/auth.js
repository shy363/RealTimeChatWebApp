import api from './api.js';

export const authService = {
  async login({ username, emojiPattern }) {
    const response = await api.post('/api/auth/login', {
      username,
      emojiPattern   // ✅ NO join
    });
    return response.data;
  },

  async register(username, emojiPattern) {
    const response = await api.post('/api/auth/register', {
      username,
      emojiPattern
    });
    return response.data;
  },

  getAuthToken() {
    return localStorage.getItem('token');
  },

  setAuthSession(token, fingerprint) {
    localStorage.setItem('token', token);
    localStorage.setItem('fingerprint', fingerprint);
  },

  removeAuthSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('fingerprint');
  },

  async validateToken() {
    const response = await api.get('/api/auth/validate'); // ✅ FIXED
    return response.data;
  }
};
