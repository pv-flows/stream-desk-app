import { DeckButtonItem, PageItem, useDeckStore } from '../store/deckStore';
import { useThemeStore } from '../store/themeStore';
import { ThemeName } from '../theme/colors';

export interface CommandMessage {
  action: string;
  payload?: string;
}

export interface SyncLayoutPayload {
  theme?: ThemeName;
  buttons?: DeckButtonItem[];
  pages?: PageItem[];
}

export interface ServerResponse {
  status?: string;
  action?: string;
  payload?: SyncLayoutPayload | DeckButtonItem[] | string;
  pages?: PageItem[];
  buttons?: DeckButtonItem[];
  message?: string;
  event?: string;
  page_index?: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

class WebSocketService {
  private socket: WebSocket | null = null;
  private statusListeners: Array<(status: ConnectionStatus) => void> = [];
  private messageListeners: Array<(data: ServerResponse) => void> = [];
  private pageChangeListeners: Array<(pageIndex: number) => void> = [];
  private currentStatus: ConnectionStatus = 'disconnected';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isManualDisconnect: boolean = false;
  private lastUrl: string = '';

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.isManualDisconnect || !this.lastUrl) return;
    if (this.reconnectTimer) return;

    console.log('[WebSocket] Agendando reconexão automática em 3000ms...');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isManualDisconnect && this.lastUrl) {
        console.log('[WebSocket] Tentando reconectar automaticamente...');
        this.connect(this.lastUrl);
      }
    }, 3000);
  }

  public connect(url: string): void {
    const trimmedUrl = url?.trim();
    if (!trimmedUrl) {
      console.warn('[WebSocket] URL inválida para conexão.');
      this.setStatus('error');
      return;
    }

    this.lastUrl = trimmedUrl;
    this.isManualDisconnect = false;
    this.clearTimers();

    if (this.socket) {
      try {
        this.socket.onopen = null;
        this.socket.onmessage = null;
        this.socket.onerror = null;
        this.socket.onclose = null;
        this.socket.close();
      } catch {}
      this.socket = null;
    }

    this.setStatus('connecting');
    console.log(`[WebSocket] Conectando ao servidor: ${trimmedUrl}`);

    try {
      this.socket = new WebSocket(trimmedUrl);

      this.socket.onopen = () => {
        this.setStatus('connected');
        console.log('[WebSocket] Conectado com sucesso ao servidor desktop!');

        // Inicia envio periódico de heartbeat a cada 30 segundos
        this.clearTimers();
        this.heartbeatTimer = setInterval(() => {
          this.sendCommand('ping');
        }, 30000);

        // Solicita automaticamente o layout de botões persistido no SQLite do PC
        this.sendCommand('get_layout');
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed: ServerResponse = JSON.parse(event.data);
          console.log('[WebSocket] Resposta do servidor recebida:', parsed);

          // Trata evento de Auto-Profile (troca de página disparada pelo PC)
          if (parsed.event === 'page_change' && typeof parsed.page_index === 'number') {
            console.log('[WebSocket] Evento page_change recebido:', parsed.page_index);
            this.pageChangeListeners.forEach((listener) => listener(parsed.page_index!));
          }

          if (parsed.action === 'sync_layout' || parsed.event === 'sync_layout') {
            if (Array.isArray(parsed.pages)) {
              useThemeStore.getState().setPages(parsed.pages);
            }
            if (Array.isArray(parsed.buttons)) {
              useDeckStore.getState().setButtons(parsed.buttons);
            }

            if (parsed.payload) {
              const payload =
                typeof parsed.payload === 'string' ? JSON.parse(parsed.payload) : parsed.payload;

              if (Array.isArray(payload)) {
                useDeckStore.getState().setButtons(payload);
              } else {
                if (Array.isArray(payload.buttons)) {
                  useDeckStore.getState().setButtons(payload.buttons);
                }
                if (Array.isArray(payload.pages)) {
                  useThemeStore.getState().setPages(payload.pages);
                }
                if (payload.theme) {
                  useThemeStore.getState().setTheme(payload.theme);
                }
              }
            }
          }

          this.notifyMessage(parsed);
        } catch (err) {
          console.warn('[WebSocket] Mensagem não formatada em JSON:', event.data);
        }
      };

      this.socket.onerror = (error) => {
        console.error('[WebSocket] Erro na conexão:', error);
        if (this.heartbeatTimer) {
          clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = null;
        }
        this.setStatus('error');
        this.scheduleReconnect();
      };

      this.socket.onclose = (event) => {
        console.log(`[WebSocket] Conexão encerrada (código ${event.code}): ${event.reason}`);
        if (this.heartbeatTimer) {
          clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = null;
        }
        if (this.currentStatus !== 'error') {
          this.setStatus('disconnected');
        }
        this.socket = null;
        this.scheduleReconnect();
      };
    } catch (err) {
      console.error('[WebSocket] Falha ao instanciar WebSocket:', err);
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.isManualDisconnect = true;
    this.clearTimers();
    if (this.socket) {
      try {
        this.socket.onopen = null;
        this.socket.onmessage = null;
        this.socket.onerror = null;
        this.socket.onclose = null;
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    this.setStatus('disconnected');
  }

  public sendCommand(action: string, payload?: string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Não foi possível enviar comando: socket não está conectado.');
      return false;
    }

    const command: CommandMessage = { action, payload };
    const jsonString = JSON.stringify(command);
    this.socket.send(jsonString);
    console.log('[WebSocket] Comando enviado:', jsonString);
    return true;
  }

  public getStatus(): ConnectionStatus {
    return this.currentStatus;
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.push(callback);
    callback(this.currentStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
    };
  }

  public onMessage(callback: (data: ServerResponse) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter((cb) => cb !== callback);
    };
  }

  public onPageChange(callback: (pageIndex: number) => void): () => void {
    this.pageChangeListeners.push(callback);
    return () => {
      this.pageChangeListeners = this.pageChangeListeners.filter((cb) => cb !== callback);
    };
  }

  private setStatus(status: ConnectionStatus): void {
    this.currentStatus = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  private notifyMessage(data: ServerResponse): void {
    this.messageListeners.forEach((listener) => listener(data));
  }
}

export const websocketService = new WebSocketService();
