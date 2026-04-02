import api from './api.js';

export const authService = {
  async login({ username, emojiPattern }) {
  const response = await api.post('/api/auth/login', {
    username,
    emojiPattern: emojiPattern.join(',')
  });
  return response.data;
},

  async register({ username, emojiPattern }) {
  const response = await api.post('/api/auth/register', {
    username,
    emojiPattern: emojiPattern.join(',')
  });
  return response.data;
},

  async validateToken() {
    const response = await api.get('/auth/validate');
    return response.data;
  }
};
