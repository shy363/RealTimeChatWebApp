import axios from 'axios';
import { generateSecurityHeaders } from '../utils/security.js';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocal ? 'http://localhost:5000/api' : '/api';

const api = axios.create({
  baseURL: API_URL
});

// UNIQUE SECURITY INTERCEPTOR: Cryptographic Request Handshaking
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  const fingerprint = localStorage.getItem('fingerprint');
  
  if (token && fingerprint && config.headers) {
    const secHeaders = await generateSecurityHeaders(token, fingerprint);
    Object.assign(config.headers, secHeaders);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
