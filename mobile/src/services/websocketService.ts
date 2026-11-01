import { DeckButtonItem, useDeckStore } from '../store/deckStore';
import { useThemeStore } from '../store/themeStore';
import { ThemeName } from '../theme/colors';

export interface CommandMessage {
  action: string;
  payload?: string;
}

export interface SyncLayoutPayload {
  theme?: ThemeName;
  buttons?: DeckButtonItem[];
}

export interface ServerResponse {
  status?: string;
  action?: string;
  payload?: SyncLayoutPayload | DeckButtonItem[] | string;
  message?: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

class WebSocketService {
  private socket: WebSocket | null = null;
  private statusListeners: Array<(status: ConnectionStatus) => void> = [];
  private messageListeners: Array<(data: ServerResponse) => void> = [];
  private currentStatus: ConnectionStatus = 'disconnected';

  public connect(url: string): void {
    const trimmedUrl = url?.trim();
    if (!trimmedUrl) {
      console.warn('[WebSocket] URL inválida para conexão.');
      this.setStatus('error');
      return;
    }

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
        // Solicita automaticamente o layout de botões persistido no SQLite do PC
        this.sendCommand('get_layout');
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed: ServerResponse = JSON.parse(event.data);
          console.log('[WebSocket] Resposta do servidor recebida:', parsed);

          if (parsed.action === 'sync_layout' && parsed.payload) {
            const payload =
              typeof parsed.payload === 'string' ? JSON.parse(parsed.payload) : parsed.payload;

            if (Array.isArray(payload)) {
              useDeckStore.getState().setButtons(payload);
            } else {
              if (Array.isArray(payload.buttons)) {
                useDeckStore.getState().setButtons(payload.buttons);
              }
              if (payload.theme) {
                useThemeStore.getState().setTheme(payload.theme);
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
        this.setStatus('error');
      };

      this.socket.onclose = (event) => {
        console.log(`[WebSocket] Conexão encerrada (código ${event.code}): ${event.reason}`);
        if (this.currentStatus !== 'error') {
          this.setStatus('disconnected');
        }
        this.socket = null;
      };
    } catch (err) {
      console.error('[WebSocket] Falha ao instanciar WebSocket:', err);
      this.setStatus('error');
    }
  }

  public disconnect(): void {
    if (this.socket) {
      try {
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

  private setStatus(status: ConnectionStatus): void {
    this.currentStatus = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  private notifyMessage(data: ServerResponse): void {
    this.messageListeners.forEach((listener) => listener(data));
  }
}

export const websocketService = new WebSocketService();
