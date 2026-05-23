import { create } from 'zustand';
import api from '../lib/api';

interface Factory {
  id: string;
  name: string;
  location?: string;
  userRole?: string;
  permissions?: string[];
}

interface AppState {
  lang: 'en' | 'hi';
  theme: 'light' | 'dark';
  factories: Factory[];
  activeFactory: string | null;
  toggleLang: () => void;
  toggleTheme: () => void;
  setActiveFactory: (id: string) => void;
  loadFactories: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  lang: (localStorage.getItem('lang') as 'en' | 'hi') || 'en',
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  factories: [],
  activeFactory: localStorage.getItem('activeFactory'),

  toggleLang: () =>
    set((s) => {
      const next = s.lang === 'en' ? 'hi' : 'en';
      localStorage.setItem('lang', next);
      return { lang: next };
    }),

  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return { theme: next };
    }),

  setActiveFactory: (id) => {
    localStorage.setItem('activeFactory', id);
    set({ activeFactory: id });
  },

  loadFactories: async () => {
    const { data } = await api.get('/factories');
    const saved = localStorage.getItem('activeFactory');
    const activeFactory = data.find((f: Factory) => f.id === saved)?.id || data[0]?.id || null;
    if (activeFactory) localStorage.setItem('activeFactory', activeFactory);
    set({ factories: data, activeFactory });
  },
}));

// Apply theme on load
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
