import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Production URL
const PRODUCTION_URL = 'https://api.brickpro.managementsystems.in/api';

// Development URL - your local machine IP
const DEVELOPMENT_URL = 'http://192.168.1.7:4000/api';

const API_URL = __DEV__ ? DEVELOPMENT_URL : PRODUCTION_URL;

// Callback for blocked state — set by auth store
let onBlocked: ((msg: string) => void) | null = null;
export function setOnBlocked(cb: (msg: string) => void) { onBlocked = cb; }

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
api.interceptors.request.use(async (config) => {
  const isAuthRoute = config.url?.includes('/auth/login') || config.url?.includes('/auth/send-otp') || config.url?.includes('/auth/verify-otp');
  if (!isAuthRoute) {
    const token = await SecureStore.getItemAsync('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401 and 403
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/');

    // Handle disabled/expired account
    if (error.response?.status === 403) {
      const code = error.response?.data?.code;
      const msg = error.response?.data?.error;
      if (code === 'DISABLED' || code === 'EXPIRED' || msg?.includes('Service disabled') || msg?.includes('Trial expired')) {
        if (onBlocked) onBlocked(msg || 'Account suspended. Contact admin.');
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && !isAuthRoute) {
      await SecureStore.deleteItemAsync('token');
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
