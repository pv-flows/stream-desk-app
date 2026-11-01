import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface DeckButton {
  id: number;
  label: string;
  action_name: string;
  color: string;
  icon: string;
  page_index: number;
  position: number;
}

export interface Page {
  id: number;
  name: string;
}

export interface WindowRule {
  id: number;
  process_name: string;
  page_index: number;
}

export interface DashboardState {
  pages: Page[];
  buttons: DeckButton[];
  windowRules: WindowRule[];
  theme: string;
  localIp: string;
  activePageIndex: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActivePageIndex: (index: number) => void;
  setButtons: (buttons: DeckButton[]) => void;
  fetchPages: () => Promise<void>;
  fetchButtons: () => Promise<void>;
  fetchTheme: () => Promise<void>;
  fetchLocalIp: () => Promise<void>;
  fetchWindowRules: () => Promise<void>;
  init: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  pages: [
    { id: 1, name: "Principal" },
    { id: 2, name: "Mídia & Áudio" },
    { id: 3, name: "Dev & Terminal" },
    { id: 4, name: "Produtividade" },
  ],
  buttons: [],
  windowRules: [],
  theme: "default",
  localIp: "127.0.0.1",
  activePageIndex: 1,
  isLoading: false,
  error: null,

  setActivePageIndex: (index: number) => {
    set({ activePageIndex: index });
  },

  setButtons: (buttons: DeckButton[]) => {
    set({ buttons });
  },

  fetchPages: async () => {
    try {
      const pages = await invoke<Page[]>("get_pages");
      if (Array.isArray(pages) && pages.length > 0) {
        set((state) => {
          const currentValid = pages.some((p) => p.id === state.activePageIndex);
          return {
            pages,
            activePageIndex: currentValid ? state.activePageIndex : pages[0].id,
          };
        });
      }
    } catch (err) {
      console.warn("[Store] Erro ao buscar páginas via IPC:", err);
    }
  },

  fetchButtons: async () => {
    try {
      const buttons = await invoke<DeckButton[]>("get_buttons");
      if (Array.isArray(buttons)) {
        set({ buttons });
      }
    } catch (err) {
      console.warn("[Store] Erro ao buscar botões via IPC:", err);
    }
  },

  fetchTheme: async () => {
    try {
      const theme = await invoke<string>("get_theme");
      if (typeof theme === "string") {
        set({ theme });
      }
    } catch (err) {
      console.warn("[Store] Erro ao buscar tema via IPC:", err);
    }
  },

  fetchLocalIp: async () => {
    try {
      const localIp = await invoke<string>("get_local_ip");
      if (typeof localIp === "string" && localIp.trim().length > 0) {
        set({ localIp });
      }
    } catch (err) {
      console.warn("[Store] Erro ao buscar local IP via IPC:", err);
    }
  },

  fetchWindowRules: async () => {
    try {
      const rules = await invoke<WindowRule[]>("get_window_rules");
      if (Array.isArray(rules)) {
        set({ windowRules: rules });
      }
    } catch (err) {
      console.warn("[Store] Erro ao buscar window rules via IPC:", err);
    }
  },

  init: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.allSettled([
        get().fetchPages(),
        get().fetchButtons(),
        get().fetchTheme(),
        get().fetchLocalIp(),
        get().fetchWindowRules(),
      ]);
    } catch (err) {
      set({ error: String(err) });
    } finally {
      set({ isLoading: false });
    }
  },
}));
