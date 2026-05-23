import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  clientId: string | null;
  loading: boolean;
  login: (mobile: string, otp: string) => Promise<void>;
  loginWithPassword: (email: string, mobile: string, password: string) => Promise<void>;
  signup: (name: string, mobile: string, factoryName: string, email?: string, password?: string, location?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  clientId: null,
  loading: true,

  login: async (mobile, otp) => {
    const { data } = await api.post('/auth/verify-otp', { mobile, otp });
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, clientId: data.client.id });
  },

  loginWithPassword: async (email, mobile, password) => {
    const body = email ? { email, password } : { mobile, password };
    const { data } = await api.post('/auth/login', body);
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, clientId: data.client.id });
  },

  signup: async (name: string, mobile: string, factoryName: string, email?: string, password?: string, location?: string) => {
    const { data } = await api.post('/auth/trial-signup', { name, mobile, factoryName, email, password, location });
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, clientId: data.client.id });
  },

  logout: () => {
    localStorage.clear();
    set({ user: null, clientId: null });
  },

  checkAuth: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: { id: data.id, name: data.name, role: data.role }, clientId: data.clientId, loading: false });
    } catch {
      set({ user: null, clientId: null, loading: false });
    }
  },
}));
