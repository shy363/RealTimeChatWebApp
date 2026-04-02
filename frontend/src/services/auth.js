import api from './api.js';

export const authService = {
  async login({ username, emojiPattern }) {
  const response = await api.post('/auth/login', {
    username,
    pattern: emojiPattern.join(',')
  });
  return response.data;
}

  async register(username, emojiPattern) {
  const response = await api.post('/auth/register', {
    username,
    pattern: emojiPattern.join(',')
  });
  return response.data;
}
  async validateToken() {
    const response = await api.get('/auth/validate');
    return response.data;
  },

  setAuthSession(token, fingerprint) {
    localStorage.setItem('token', token);
    localStorage.setItem('fingerprint', fingerprint);
  },

  getAuthToken() {
    return localStorage.getItem('token');
  },

  getFingerprint() {
    return localStorage.getItem('fingerprint');
  },

  removeAuthSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('fingerprint');
  },

  async getUsers() {
    const response = await api.get('/auth/users');
    return response.data;
  }
};
