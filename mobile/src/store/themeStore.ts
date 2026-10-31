import { create } from 'zustand';
import { ThemeName, ThemePalette, themes } from '../theme/colors';

export interface DeckButtonItem {
  id: number | string;
  label: string;
  action_name: string;
  color: string;
  icon?: string;
}

interface ThemeState {
  theme: ThemeName;
  palette: ThemePalette;
  buttons: DeckButtonItem[];
  setTheme: (theme: ThemeName) => void;
  setButtons: (buttons: DeckButtonItem[]) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'default',
  palette: themes.default,
  buttons: [],
  setTheme: (theme: ThemeName) =>
    set({
      theme,
      palette: themes[theme],
    }),
  setButtons: (buttons: DeckButtonItem[]) => set({ buttons }),
}));
