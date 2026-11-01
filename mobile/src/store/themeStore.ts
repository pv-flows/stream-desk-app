import { create } from 'zustand';
import { ThemeName, ThemePalette, themes } from '../theme/colors';

export interface DeckButtonItem {
  id: number | string;
  label: string;
  action_name: string;
  color: string;
  icon?: string;
  page_index?: number;
  position?: number;
}

export interface PageItem {
  id: number;
  name: string;
}

interface ThemeState {
  theme: ThemeName;
  palette: ThemePalette;
  buttons: DeckButtonItem[];
  pages: PageItem[];
  setTheme: (theme: ThemeName) => void;
  setButtons: (buttons: DeckButtonItem[]) => void;
  setPages: (pages: PageItem[]) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'default',
  palette: themes.default,
  buttons: [],
  pages: [{ id: 1, name: 'Principal' }],
  setTheme: (theme: ThemeName) =>
    set({
      theme: themes[theme] ? theme : 'default',
      palette: themes[theme] ?? themes.default,
    }),
  setButtons: (buttons: DeckButtonItem[]) => set({ buttons }),
  setPages: (pages: PageItem[]) => set({ pages }),
}));
