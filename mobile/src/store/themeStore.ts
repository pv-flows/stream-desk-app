import { create } from 'zustand';
import { ThemeName, ThemePalette, themes } from '../theme/colors';

interface ThemeState {
  theme: ThemeName;
  palette: ThemePalette;
  setTheme: (theme: ThemeName) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'default',
  palette: themes.default,
  setTheme: (theme: ThemeName) =>
    set({
      theme,
      palette: themes[theme],
    }),
}));

