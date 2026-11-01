export type ThemeName =
  | 'default'
  | 'escuro'
  | 'claro'
  | 'amoled'
  | 'apple'
  | 'windows'
  | 'steam'
  | 'oneui'
  | 'chromebook'
  | 'ios'
  | 'gamer';

export interface ThemePalette {
  background: string;
  buttonBackground: string;
  textColor: string;
  highlight: string;
  borderColor: string;
}

export const themes: Record<ThemeName, ThemePalette> = {
  default: {
    background: '#09090b',
    buttonBackground: 'rgba(24, 24, 27, 0.75)',
    textColor: '#f4f4f5',
    highlight: '#6366f1',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  escuro: {
    background: '#09090b',
    buttonBackground: 'rgba(24, 24, 27, 0.75)',
    textColor: '#f4f4f5',
    highlight: '#6366f1',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  claro: {
    background: '#f8fafc',
    buttonBackground: 'rgba(255, 255, 255, 0.85)',
    textColor: '#0f172a',
    highlight: '#4f46e5',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  amoled: {
    background: '#000000',
    buttonBackground: 'rgba(12, 12, 12, 0.95)',
    textColor: '#ffffff',
    highlight: '#6366f1',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  apple: {
    background: '#1c1c1e',
    buttonBackground: 'rgba(255, 255, 255, 0.14)',
    textColor: '#ffffff',
    highlight: '#0a84ff',
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  steam: {
    background: '#171a21',
    buttonBackground: '#1b2838',
    textColor: '#c7d5e0',
    highlight: '#66c0f4',
    borderColor: '#2a475e',
  },
  oneui: {
    background: '#000000',
    buttonBackground: '#17171a',
    textColor: '#fafaff',
    highlight: '#3e8aff',
    borderColor: '#2c2c34',
  },
  chromebook: {
    background: '#202124',
    buttonBackground: '#303134',
    textColor: '#e8eaed',
    highlight: '#8ab4f8',
    borderColor: '#5f6368',
  },
  ios: {
    background: '#1c1c1e',
    buttonBackground: 'rgba(255, 255, 255, 0.14)',
    textColor: '#ffffff',
    highlight: '#0a84ff',
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  windows: {
    background: '#111827',
    buttonBackground: 'rgba(32, 32, 32, 0.55)',
    textColor: '#f3f4f6',
    highlight: '#60cdff',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  gamer: {
    background: '#090014',
    buttonBackground: '#16002b',
    textColor: '#00ffcc',
    highlight: '#ff007f',
    borderColor: '#ff007f',
  },
};
