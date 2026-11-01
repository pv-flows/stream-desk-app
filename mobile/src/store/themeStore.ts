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

export interface AppearanceSettings {
  theme: ThemeName | string;
  accent_color: string;
  grid_columns: number;
  vibration_enabled: boolean;
  icon_style: 'linha' | 'preenchido' | string;
}

interface ThemeState {
  theme: ThemeName;
  palette: ThemePalette;
  buttons: DeckButtonItem[];
  pages: PageItem[];
  appearance: AppearanceSettings;
  setTheme: (theme: ThemeName) => void;
  setButtons: (buttons: DeckButtonItem[]) => void;
  setPages: (pages: PageItem[]) => void;
  setAppearance: (appearance: Partial<AppearanceSettings>) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'default',
  palette: themes.default,
  buttons: [],
  pages: [{ id: 1, name: 'Principal' }],
  appearance: {
    theme: 'escuro',
    accent_color: 'purple',
    grid_columns: 3,
    vibration_enabled: true,
    icon_style: 'linha',
  },
  setTheme: (theme: ThemeName) =>
    set((state) => {
      const validTheme: ThemeName = themes[theme] ? theme : 'default';
      return {
        theme: validTheme,
        palette: themes[validTheme] ?? themes.default,
        appearance: { ...state.appearance, theme: validTheme },
      };
    }),
  setButtons: (buttons: DeckButtonItem[]) => set({ buttons }),
  setPages: (pages: PageItem[]) => set({ pages }),
  setAppearance: (newAppearance: Partial<AppearanceSettings>) =>
    set((state) => {
      const merged = { ...state.appearance, ...newAppearance };
      const themeKey = (merged.theme || state.theme) as ThemeName;
      const validTheme: ThemeName = themes[themeKey] ? themeKey : 'default';
      return {
        appearance: merged,
        theme: validTheme,
        palette: themes[validTheme] ?? themes.default,
      };
    }),
}));
