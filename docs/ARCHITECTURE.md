# Arquitetura do Sistema - Stream Desk (Freemium)

## 1. Visão Geral
Sistema cliente-servidor para operação em rede local (LAN), projetado para automação e produtividade com baixíssima latência e consumo mínimo de recursos.

- **Desktop (Servidor & Agente Local)**: Desenvolvido em **Tauri** (Rust + Frontend leve), atuando como servidor WebSocket local, executor de macros/atalhos do SO, leitor de telemetria/janelas ativas e gerenciador de persistência via **SQLite**.
- **Mobile (Cliente Painel)**: Desenvolvido em **React Native (Expo)** para Android e iOS, funcionando como painel de controle interativo com botões customizáveis, feedback tátil e alternância de perfis.

---

## 2. Modelo de Negócio (Freemium)
- **Camada Gratuita (Core)**:
  - Criação de grades de botões básicas (atalhos de teclado, abertura de apps, controle de mídia).
  - Conexão e pareamento local via WebSocket.
- **Camada Pro / Paga**:
  - Temas visuais e customização cosmética avançada.
  - Rastreamento contextual automático de janelas ativas (troca de perfil por app focado).
  - Módulos avançados (expansão futura para webcam virtual via WebRTC, plugins de terceiros).

---

## 3. Comunicação & Rede
- **Protocolo de Transporte**: WebSocket bidirecional para eventos em tempo real com baixa latência.
- **Descoberta de Serviço na LAN**: mDNS / Zeroconf ou inserção direta de IP:Porta com QR Code de pareamento.
- **Formato de Mensagens**: JSON tipado com contrato de schema unificado.

---

## 4. Persistência de Dados
- **Motor**: SQLite (`streamdesk.db` gerenciando tabelas `buttons`, `pages`, `window_rules` e `settings`).
- **Tabela `settings`**: Chaves ativas de configuração: `active_theme`, `accent_color`, `grid_columns`, `vibration_enabled`, `icon_style`.

---

## 5. Contratos de Comunicação e IPC (Fase 3)

### 5.1 Comandos IPC (Tauri `invoke`)

| Comando | Entrada | Saída | Descrição |
| :-- | :-- | :-- | :-- |
| `get_appearance_settings` | Nenhuma | `AppearanceSettings` | Retorna configurações de tema, paleta, grade, vibração e estilo de ícones do SQLite. |
| `set_appearance_settings` | `{ settings: AppearanceSettings }` | `()` | Persiste configurações no SQLite e dispara broadcast `sync_layout` aos clientes WebSocket. |
| `get_buttons` | Nenhuma | `Vec<Button>` | Lista todos os botões configurados ordenados por posição. |
| `add_button` | `{ label, action_name, color, icon?, page_index?, position? }` | `()` | Cria novo botão e emite broadcast do layout. |
| `update_button` | `{ id, label, action_name, color, icon?, page_index?, position? }` | `()` | Atualiza propriedades do botão e emite broadcast. |
| `delete_button` | `{ id }` | `()` | Remove o botão por ID e emite broadcast. |
| `get_pages` | Nenhuma | `Vec<Page>` | Lista as páginas disponíveis. |
| `add_page` | `{ name }` | `i32` | Cria nova página e emite broadcast. |
| `update_page` | `{ id, name }` | `()` | Renomeia página e emite broadcast. |
| `delete_page` | `{ id }` | `()` | Remove página e botões associados (mínimo 1 mantida). |
| `get_window_rules` | Nenhuma | `Vec<WindowRule>` | Lista regras de auto-profile (incluindo campo `enabled`). |
| `add_window_rule` | `{ processName, pageIndex }` | `()` | Adiciona regra associando processo à página (inicia habilitada). |
| `toggle_window_rule` | `{ id, enabled }` | `()` | Ativa ou desativa regra de troca automática sem excluí-la do banco. |
| `delete_window_rule` | `{ id }` | `()` | Remove regra por ID. |
| `import_backup` | `{ backup: BackupData }` | `()` | Executa transação atômica no SQLite para restauração de layout, botões, regras e temas, disparando broadcast WS. |
| `get_system_settings` | Nenhuma | `SystemSettings` | Obtém configurações de inicialização com Windows e minimizar para bandeja. |
| `set_system_settings` | `{ settings: SystemSettings }` | `()` | Persiste configurações no SQLite e aplica chave de registro no Windows (`HKCU\...\Run`). |
| `get_connected_devices` | Nenhuma | `Vec<ConnectedDevice>` | Lista os clientes WebSocket atualmente conectados (id, nome, ip, horário). |
| `disconnect_device` | `{ id: String }` | `()` | Encerra a conexão WebSocket do dispositivo indicado pelo servidor. |
| `get_obs_settings` | Nenhuma | `ObsSettings` | Retorna configurações de conexão com o OBS Studio WebSocket v5 (host, port, senha, enabled). |
| `set_obs_settings` | `{ settings: ObsSettings }` | `()` | Salva configurações de conexão do OBS Studio no SQLite `settings`. |
| `test_obs_connection` | `{ settings: ObsSettings }` | `String` | Realiza handshake de teste com o OBS Studio e retorna mensagem com a versão conectada. |
| `execute_obs_action` | `{ action: String }` | `Value` | Despacha comando OBS (ToggleRecord, ToggleStream, SetCurrentProgramScene, ToggleInputMute). |

### 5.2 Eventos WebSocket (`/ws`)

#### Broadcast: `sync_layout`
Disparado pelo Desktop sempre que houver modificações em botões, páginas, tema ou configurações de aparência:
```json
{
  "status": "ok",
  "action": "sync_layout",
  "event": "sync_layout",
  "pages": [{ "id": 1, "name": "Principal" }],
  "buttons": [...],
  "theme": "escuro",
  "appearance": {
    "theme": "escuro",
    "accent_color": "purple",
    "grid_columns": 3,
    "vibration_enabled": true,
    "icon_style": "linha"
  },
  "payload": {
    "theme": "escuro",
    "pages": [...],
    "buttons": [...],
    "appearance": { ... }
  },
  "message": "Layout atualizado em tempo real pelo PC"
}
```

#### Evento: `page_change`
Disparado pelo rastreador de janelas ativas (`active_win_pos_rs`) quando um processo com regra cadastrada ganha foco:
```json
{
  "event": "page_change",
  "page_index": 1,
  "process_name": "chrome.exe"
}
```

### 5.3 Comandos do Cliente para o Servidor (`/ws`)

| Ação | Payload | Descrição |
| :-- | :-- | :-- |
| `identify` | `"Stream Desk (Android)"` | Notifica o servidor do nome amigável/plataforma do dispositivo cliente. |
| `get_layout` | Nenhuma | Solicita envio imediato do layout de botões, páginas e aparência (`sync_layout`). |
| `ping` | Nenhuma | Mensagem periódica de keepalive (responde com `pong`). |
| `press_button` | `"Ctrl+C"` | Dispara a execução da macro/atalho associado no Windows. |

### 5.4 Descoberta de Rede na LAN (Zeroconf / mDNS / HTTP)

- **Endpoint HTTP de Descoberta (`GET /discovery` e `GET /health`)**:
  Retorna JSON identificando o servidor na porta 8080:
  ```json
  {
    "status": "ok",
    "app": "streamdesk",
    "name": "Stream Desk Desktop",
    "version": "1.0.0",
    "ip": "192.168.1.15",
    "ws_url": "ws://192.168.1.15:8080/ws"
  }
  ```
- **Beacon e Responder UDP (Porta 8081)**:
  O servidor escuta datagramas UDP contendo `"STREAMDESK_DISCOVER"` e responde diretamente ao remetente com os dados de conexão do servidor.
- **Cliente Mobile (`discoveryService.ts`)**:
  Realiza varredura de candidatos na sub-rede local e pareamento automático dispensando leitura de QR Code em redes locais fechadas.
