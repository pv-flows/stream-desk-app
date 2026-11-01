export type ThemeName = 'default' | 'apple' | 'steam' | 'ios' | 'windows' | 'gamer';

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
    background: '#f2f2f7',
    buttonBackground: '#ffffff',
    textColor: '#1c1c1e',
    highlight: '#007aff',
    borderColor: '#d1d1d6',
  },
  steam: {
    background: '#171a21',
    buttonBackground: '#1b2838',
    textColor: '#c7d5e0',
    highlight: '#66c0f4',
    borderColor: '#2a475e',
  },
  ios: {
    background: '#f2f2f7',
    buttonBackground: '#ffffff',
    textColor: '#1c1c1e',
    highlight: '#007aff',
    borderColor: '#d1d1d6',
  },
  windows: {
    background: '#1f1f1f',
    buttonBackground: '#2d2d2d',
    textColor: '#ffffff',
    highlight: '#0078d4',
    borderColor: '#404040',
  },
  gamer: {
    background: '#090014',
    buttonBackground: '#16002b',
    textColor: '#00ffcc',
    highlight: '#ff007f',
    borderColor: '#ff007f',
  },
};

