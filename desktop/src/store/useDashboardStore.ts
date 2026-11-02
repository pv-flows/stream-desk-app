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
  custom_accent_hex?: string | null;
  custom_bg_hex?: string | null;
  button_radius?: "sharp" | "smooth" | "pill" | string;
  show_labels?: boolean;
  label_font_size?: "compact" | "normal" | "large" | string;
  haptic_strength?: "soft" | "medium" | "strong" | string;
  glow_enabled?: boolean;
}

export interface SystemSettings {
  start_with_windows: boolean;
  minimize_to_tray: boolean;
  start_minimized: boolean;
  keep_phone_awake: boolean;
  notify_device_connection: boolean;
  ws_port: number;
}

export interface DatabaseInfo {
  file_size_bytes: number;
  total_buttons: number;
  total_pages: number;
  total_rules: number;
  integrity_ok: boolean;
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
  databaseInfo: DatabaseInfo | null;
  fetchDatabaseInfo: () => Promise<DatabaseInfo | null>;
  vacuumDatabase: () => Promise<number>;
  resetToFactoryDefaults: () => Promise<void>;
  saveQuickSnapshot: () => { success: boolean; timestamp: string };
  restoreQuickSnapshot: () => Promise<boolean>;
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
    grid_columns: 5,
    vibration_enabled: true,
    icon_style: "linha",
    custom_accent_hex: null,
    custom_bg_hex: null,
    button_radius: "smooth",
    show_labels: true,
    label_font_size: "normal",
    haptic_strength: "medium",
    glow_enabled: true,
  },
  systemSettings: {
    start_with_windows: false,
    minimize_to_tray: true,
    start_minimized: false,
    keep_phone_awake: true,
    notify_device_connection: true,
    ws_port: 8080,
  },
  databaseInfo: null,
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

  fetchDatabaseInfo: async () => {
    try {
      const info = await invoke<DatabaseInfo>("get_database_info");
      if (info && typeof info === "object") {
        set({ databaseInfo: info });
        return info;
      }
    } catch (err) {
      console.warn("[Store] Erro ao buscar info do banco via IPC:", err);
    }
    return null;
  },

  vacuumDatabase: async () => {
    try {
      const size = await invoke<number>("vacuum_database");
      await get().fetchDatabaseInfo();
      return typeof size === "number" ? size : 0;
    } catch (err) {
      console.warn("[Store] Erro ao executar VACUUM via IPC:", err);
      return 0;
    }
  },

  resetToFactoryDefaults: async () => {
    try {
      await invoke("reset_to_factory_defaults");
      await Promise.allSettled([
        get().fetchPages(),
        get().fetchButtons(),
        get().fetchWindowRules(),
        get().fetchAppearance(),
        get().fetchSystemSettings(),
        get().fetchDatabaseInfo(),
      ]);
    } catch (err) {
      console.warn("[Store] Erro ao redefinir aos padrões de fábrica:", err);
      throw err;
    }
  },

  saveQuickSnapshot: () => {
    try {
      const snapshot = {
        version: "1.2.3",
        exportedAt: new Date().toISOString(),
        pages: get().pages,
        buttons: get().buttons,
        windowRules: get().windowRules,
        appearance: get().appearance,
        theme: get().theme,
      };
      localStorage.setItem("streamdesk_quick_snapshot", JSON.stringify(snapshot));
      return { success: true, timestamp: snapshot.exportedAt };
    } catch (err) {
      console.warn("[Store] Erro ao salvar snapshot no localStorage:", err);
      return { success: false, timestamp: "" };
    }
  },

  restoreQuickSnapshot: async () => {
    try {
      const raw = localStorage.getItem("streamdesk_quick_snapshot");
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      await get().importBackup(parsed);
      return true;
    } catch (err) {
      console.warn("[Store] Erro ao restaurar snapshot:", err);
      return false;
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
        get().fetchDatabaseInfo(),
      ]);
    } catch (err) {
      set({ error: String(err) });
    } finally {
      set({ isLoading: false });
    }
  },
}));
