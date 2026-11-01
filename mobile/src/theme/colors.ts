export type ThemeName =
  | 'default'
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
    background: '#0f172a',
    buttonBackground: '#1e293b',
    textColor: '#f8fafc',
    highlight: '#38bdf8',
    borderColor: '#334155',
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

