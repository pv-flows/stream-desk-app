export interface CommandMessage {
  action: string;
  payload?: string;
}

export interface ServerResponse {
  status: string;
  message: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

class WebSocketService {
  private socket: WebSocket | null = null;
  // IP padrão provisório para desenvolvimento em rede local (LAN).
  // Ajuste para o IP local da máquina host executando o Tauri (ex: ws://192.168.1.50:8080/ws)
  private defaultUrl: string = 'ws://192.168.1.97:8080/ws';
  private statusListeners: Array<(status: ConnectionStatus) => void> = [];
  private messageListeners: Array<(data: ServerResponse) => void> = [];
  private currentStatus: ConnectionStatus = 'disconnected';

  public connect(url: string = this.defaultUrl): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('[WebSocket] Conexão já em andamento ou ativa.');
      return;
    }

    this.setStatus('connecting');
    console.log(`[WebSocket] Conectando ao servidor: ${url}`);

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.setStatus('connected');
        console.log('[WebSocket] Conectado com sucesso ao servidor desktop!');
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed: ServerResponse = JSON.parse(event.data);
          console.log('[WebSocket] Resposta do servidor recebida:', parsed);
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
        this.setStatus('disconnected');
        this.socket = null;
      };
    } catch (err) {
      console.error('[WebSocket] Falha ao instanciar WebSocket:', err);
      this.setStatus('error');
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
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

