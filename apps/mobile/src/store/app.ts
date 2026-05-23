import { create } from 'zustand';
import api from '../lib/api';

interface Factory { id: string; name: string; }

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
  lang: 'en',
  theme: 'light',
  factories: [],
  activeFactory: null,

  toggleLang: () => set((s) => ({ lang: s.lang === 'en' ? 'hi' : 'en' })),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),

  setActiveFactory: (id) => set({ activeFactory: id }),

  loadFactories: async () => {
    const { data } = await api.get('/factories');
    set({ factories: data, activeFactory: data[0]?.id || null });
  },
}));
