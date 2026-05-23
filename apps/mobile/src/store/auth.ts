import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';
import { setOnBlocked } from '../lib/api';

interface User { id: string; name: string; role: string; clientId: string; }

interface AuthState {
  user: User | null;
  loading: boolean;
  blocked: boolean;
  blockedMessage: string;
  login: (identifier: string, password: string) => Promise<void>;
  sendOtp: (mobile: string) => Promise<string | undefined>;
  loginWithOtp: (mobile: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Register blocked callback so any 403 from API triggers blocked screen
  setOnBlocked((msg) => {
    set({ blocked: true, blockedMessage: msg, user: null });
    SecureStore.deleteItemAsync('token').catch(() => {});
  });

  return {
  user: null,
  loading: true,
  blocked: false,
  blockedMessage: '',

  login: async (identifier, password) => {
    const isEmail = identifier.includes('@');
    const payload = isEmail ? { email: identifier, password } : { mobile: identifier, password };
    const { data } = await api.post('/auth/login', payload);
    await SecureStore.setItemAsync('token', data.token);
    set({ user: data.user });
  },

  sendOtp: async (mobile) => {
    const { data } = await api.post('/auth/send-otp', { mobile });
    return data.debug_otp;
  },

  loginWithOtp: async (mobile, otp) => {
    const { data } = await api.post('/auth/verify-otp', { mobile, otp });
    await SecureStore.setItemAsync('token', data.token);
    set({ user: data.user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    set({ user: null, blocked: false, blockedMessage: '' });
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) { set({ loading: false }); return; }
      const { data } = await api.get('/auth/me');
      set({ user: { id: data.id, name: data.name, role: data.role, clientId: data.clientId }, loading: false, blocked: false });
    } catch (err: any) {
      if (err.response?.status === 403) {
        const msg = err.response?.data?.error || 'Account suspended. Contact admin.';
        set({ user: null, loading: false, blocked: true, blockedMessage: msg });
      } else {
        await SecureStore.deleteItemAsync('token');
        set({ user: null, loading: false });
      }
    }
  },
}});
