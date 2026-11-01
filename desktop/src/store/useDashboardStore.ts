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
  enabled: boolean;
}

export interface AppearanceSettings {
  theme: string;
  accent_color: string;
  grid_columns: number;
  vibration_enabled: boolean;
  icon_style: "linha" | "preenchido";
}

export interface SystemSettings {
  start_with_windows: boolean;
  minimize_to_tray: boolean;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  ip: string;
  connected_at: string;
}

export interface ObsSettings {
  host: string;
  port: number;
  password?: string | null;
  enabled: boolean;
}

export interface DashboardState {
  pages: Page[];
  buttons: DeckButton[];
  windowRules: WindowRule[];
  theme: string;
  appearance: AppearanceSettings;
  systemSettings: SystemSettings;
  obsSettings: ObsSettings;
  connectedDevices: ConnectedDevice[];
  localIp: string;
  activePageIndex: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActivePageIndex: (index: number) => void;
  setButtons: (buttons: DeckButton[]) => void;
  setTheme: (theme: string) => Promise<void>;
  fetchAppearance: () => Promise<void>;
  setAppearance: (settings: Partial<AppearanceSettings>) => Promise<void>;
  fetchSystemSettings: () => Promise<void>;
  setSystemSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  fetchObsSettings: () => Promise<void>;
  setObsSettings: (settings: Partial<ObsSettings>) => Promise<void>;
  testObsConnection: (settings: ObsSettings) => Promise<string>;
  fetchConnectedDevices: () => Promise<void>;
  disconnectDevice: (id: string) => Promise<void>;
  fetchPages: () => Promise<void>;
  addPage: (name: string) => Promise<void>;
  updatePage: (id: number, name: string) => Promise<void>;
  deletePage: (id: number) => Promise<void>;
  fetchButtons: () => Promise<void>;
  fetchTheme: () => Promise<void>;
  fetchLocalIp: () => Promise<void>;
  fetchWindowRules: () => Promise<void>;
  addWindowRule: (processName: string, pageIndex: number) => Promise<void>;
  toggleWindowRule: (id: number, enabled: boolean) => Promise<void>;
  deleteWindowRule: (id: number) => Promise<void>;
  importBackup: (backup: unknown) => Promise<void>;
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
  theme: "escuro",
  appearance: {
    theme: "escuro",
    accent_color: "purple",
    grid_columns: 3,
    vibration_enabled: true,
    icon_style: "linha",
  },
  systemSettings: {
    start_with_windows: false,
    minimize_to_tray: true,
  },
  obsSettings: {
    host: "localhost",
    port: 4455,
    password: "",
    enabled: false,
  },
  connectedDevices: [],
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

  fetchAppearance: async () => {
    try {
      const appearance = await invoke<AppearanceSettings>("get_appearance_settings");
      if (appearance && typeof appearance === "object") {
        set({
          appearance,
          theme: appearance.theme || "escuro",
        });
      }
    } catch (err) {
      console.warn("[Store] Erro ao buscar appearance via IPC:", err);
    }
  },

  setAppearance: async (settings: Partial<AppearanceSettings>) => {
    const current = get().appearance;
    const updated: AppearanceSettings = {
      ...current,
      ...settings,
    };
    set({
      appearance: updated,
      theme: updated.theme,
    });
    try {
      await invoke("set_appearance_settings", { settings: updated });
    } catch (err) {
      console.warn("[Store] Erro ao persistir appearance via IPC:", err);
    }
  },

  fetchSystemSettings: async () => {
    try {
      const settings = await invoke<SystemSettings>("get_system_settings");
      if (settings && typeof settings === "object") {
        set({ systemSettings: settings });
      }
    } catch (err) {
      console.warn("[Store] Erro ao buscar system settings via IPC:", err);
    }
  },

  setSystemSettings: async (settings: Partial<SystemSettings>) => {
    const current = get().systemSettings;
    const updated: SystemSettings = { ...current, ...settings };
    set({ systemSettings: updated });
    try {
      await invoke("set_system_settings", { settings: updated });
    } catch (err) {
      console.warn("[Store] Erro ao salvar system settings via IPC:", err);
    }
  },

  fetchObsSettings: async () => {
    try {
      const s = await invoke<ObsSettings>("get_obs_settings");
      if (s && typeof s === "object") {
        set({ obsSettings: s });
      }
    } catch (err) {
      console.warn("[Store] Erro ao buscar obs settings via IPC:", err);
    }
  },

  setObsSettings: async (settings: Partial<ObsSettings>) => {
    const current = get().obsSettings;
    const updated: ObsSettings = { ...current, ...settings };
    set({ obsSettings: updated });
    try {
      await invoke("set_obs_settings", { settings: updated });
    } catch (err) {
      console.warn("[Store] Erro ao salvar obs settings via IPC:", err);
    }
  },

  testObsConnection: async (settings: ObsSettings) => {
    return await invoke<string>("test_obs_connection", { settings });
  },

  fetchConnectedDevices: async () => {
    try {
      const devices = await invoke<ConnectedDevice[]>("get_connected_devices");
      if (Array.isArray(devices)) {
        set({ connectedDevices: devices });
      }
    } catch (err) {
      console.warn("[Store] Erro ao buscar dispositivos conectados via IPC:", err);
    }
  },

  disconnectDevice: async (id: string) => {
    try {
      await invoke("disconnect_device", { id });
      set((state) => ({
        connectedDevices: state.connectedDevices.filter((d) => d.id !== id),
      }));
    } catch (err) {
      console.warn("[Store] Erro ao desconectar dispositivo via IPC:", err);
    }
  },

  setTheme: async (theme: string) => {
    await get().setAppearance({ theme });
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

  addPage: async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const newId = await invoke<number>("add_page", { name: trimmed });
      await get().fetchPages();
      if (typeof newId === "number") {
        set({ activePageIndex: newId });
      }
    } catch (err) {
      console.warn("[Store] Erro ao adicionar página via IPC:", err);
      set((state) => {
        const nextId =
          state.pages.reduce((max, p) => Math.max(max, p.id), 0) + 1;
        return {
          pages: [...state.pages, { id: nextId, name: trimmed }],
          activePageIndex: nextId,
        };
      });
    }
  },

  updatePage: async (id: number, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await invoke("update_page", { id, name: trimmed });
      await get().fetchPages();
    } catch (err) {
      console.warn("[Store] Erro ao renomear página via IPC:", err);
      set((state) => ({
        pages: state.pages.map((p) =>
          p.id === id ? { ...p, name: trimmed } : p
        ),
      }));
    }
  },

  deletePage: async (id: number) => {
    if (get().pages.length <= 1) {
      console.warn("[Store] Operação bloqueada: é necessário manter ao menos 1 página.");
      return;
    }
    try {
      await invoke("delete_page", { id });
      await get().fetchPages();
      await get().fetchButtons();
    } catch (err) {
      console.warn("[Store] Erro ao excluir página via IPC:", err);
      set((state) => {
        const remaining = state.pages.filter((p) => p.id !== id);
        const nextActive =
          state.activePageIndex === id
            ? remaining[0]?.id ?? 1
            : state.activePageIndex;
        return {
          pages: remaining,
          activePageIndex: nextActive,
        };
      });
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
      if (typeof theme === "string" && theme.trim().length > 0) {
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

  addWindowRule: async (processName: string, pageIndex: number) => {
    const trimmed = processName.trim();
    if (!trimmed) return;
    try {
      await invoke("add_window_rule", { processName: trimmed, pageIndex });
      await get().fetchWindowRules();
    } catch (err) {
      console.warn("[Store] Erro ao adicionar window rule via IPC:", err);
      set((state) => {
        const nextId =
          state.windowRules.reduce((max, r) => Math.max(max, r.id), 0) + 1;
        return {
          windowRules: [
            ...state.windowRules,
            { id: nextId, process_name: trimmed, page_index: pageIndex, enabled: true },
          ],
        };
      });
    }
  },

  toggleWindowRule: async (id: number, enabled: boolean) => {
    set((state) => ({
      windowRules: state.windowRules.map((r) =>
        r.id === id ? { ...r, enabled } : r
      ),
    }));
    try {
      await invoke("toggle_window_rule", { id, enabled });
    } catch (err) {
      console.warn("[Store] Erro ao alternar window rule via IPC:", err);
      await get().fetchWindowRules();
    }
  },

  deleteWindowRule: async (id: number) => {
    try {
      await invoke("delete_window_rule", { id });
      await get().fetchWindowRules();
    } catch (err) {
      console.warn("[Store] Erro ao deletar window rule via IPC:", err);
      set((state) => ({
        windowRules: state.windowRules.filter((r) => r.id !== id),
      }));
    }
  },

  importBackup: async (backup: unknown) => {
    await invoke("import_backup", { backup });
    await Promise.allSettled([
      get().fetchPages(),
      get().fetchButtons(),
      get().fetchAppearance(),
      get().fetchTheme(),
      get().fetchWindowRules(),
    ]);
  },

  init: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.allSettled([
        get().fetchPages(),
        get().fetchButtons(),
        get().fetchAppearance(),
        get().fetchSystemSettings(),
        get().fetchObsSettings(),
        get().fetchConnectedDevices(),
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
