import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('authToken');
    // If no token in localStorage, try to use NEXT_PUBLIC_DEV_TOKEN for local development
    if (!token && typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_DEV_TOKEN) {
      token = process.env.NEXT_PUBLIC_DEV_TOKEN;
      try { localStorage.setItem('authToken', token); } catch (e) { /* ignore */ }
    }
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Log helpful message on 401 to make dev debugging easier
api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    if (error && error.response && error.response.status === 401) {
      console.warn('API request returned 401. Ensure an auth token is set in localStorage (authToken) or NEXT_PUBLIC_DEV_TOKEN.');
    }
    return Promise.reject(error);
  }
);

export default api;
