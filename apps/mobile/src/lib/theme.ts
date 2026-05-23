export const lightColors = {
  primary: '#6C63FF',
  primaryDark: '#5A52E0',
  primaryLight: '#EEF2FF',
  accent: '#4ECDC4',
  bg: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#1E293B',
  textLight: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  cardHover: '#F0F4FF',
};

export const darkColors = {
  primary: '#8B83FF',
  primaryDark: '#6C63FF',
  primaryLight: '#1E1B4B',
  accent: '#4ECDC4',
  bg: '#0F1419',
  surface: '#1A2332',
  text: '#E4E8EC',
  textLight: '#8899A6',
  textMuted: '#657786',
  border: '#2F3B47',
  success: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA',
  cardHover: '#243447',
};

export type ThemeColors = typeof lightColors;

export const getColors = (theme: 'light' | 'dark'): ThemeColors =>
  theme === 'dark' ? darkColors : lightColors;

// Default export for backward compatibility
export const colors = lightColors;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const fonts = {
  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 18, fontWeight: '600' as const },
  h3: { fontSize: 15, fontWeight: '600' as const },
  body: { fontSize: 14 },
  caption: { fontSize: 12 },
  small: { fontSize: 11 },
};
