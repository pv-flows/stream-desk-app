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
| `get_window_rules` | Nenhuma | `Vec<WindowRule>` | Lista regras de auto-profile. |
| `add_window_rule` | `{ processName, pageIndex }` | `()` | Adiciona regra associando processo à página. |
| `delete_window_rule` | `{ id }` | `()` | Remove regra por ID. |

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
