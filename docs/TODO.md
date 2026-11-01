# TODO List - Stream Desk

## 1. Fundação & Configuração Inicial
- [x] Inicializar estrutura base do repositório e regras globais (incluindo arquitetura Dumb Client / Smart Server e State Sync).
- [x] Inicializar estrutura de projeto do **Desktop** (`desktop/`) com Tauri (React + TypeScript) e dependências WebSocket (`axum`, `tokio`, `serde`).
- [x] Inicializar estrutura de projeto do **Mobile** (`mobile/`) com React Native / Expo (TypeScript).
- [x] Configurar persistência SQLite no **Desktop** (`desktop/src-tauri/src/db.rs` com `rusqlite`).
- [x] Definir contrato de eventos e tipos compartilhados TypeScript/Rust para a comunicação WebSocket (`get_layout` / `sync_layout`).

## 2. Comunicação & Rede (LAN)
- [x] Implementar servidor WebSocket com Axum no Tauri (`0.0.0.0:8080/ws`) com resposta de eco de comandos.
- [x] Implementar cliente WebSocket nativo no Mobile com envio de comandos JSON (`sendCommand`) e status de conexão.
- [x] Implementar broadcast em tempo real (`tokio::sync::broadcast`) para sincronizar alterações de layout (`sync_layout`) imediatamente ao criar/remover botões no Desktop.
- [ ] Implementar reconexão automática contínua e pareamento por QR Code no Expo.
- [ ] Suporte a descoberta de rede (mDNS / Zeroconf).

## 3. Funcionalidades Core (Gratuitas)
- [x] Execução de atalhos globais, macros e abertura de aplicativos no Desktop (integração Enigo para teclas multimídia e crate Open para abrir calculadora).
- [x] Renderização de grade de botões interativos no Mobile (`DeckGrid` e `DeckButton`) mapeados para macros do sistema.
- [x] Persistência de perfis e botões em SQLite (`streamdesk.db` com seed automático e sincronização dinâmica via WebSocket).
- [x] Interface CRUD no cliente React do Desktop (`get_buttons`, `add_button`, `delete_button`) integrada via Tauri Commands ao SQLite.

## 4. Recursos Pro (Freemium) & Futuros
- [x] Motor de temas base (`default`, `apple`, `steam`, `gamer`) com Zustand (`themeStore`) no Mobile.
- [x] Persistência do tema ativo (`active_theme`) na tabela `settings` do SQLite e sincronização global em tempo real via payload `sync_layout` (`{ theme, buttons }`).
- [ ] Customização cosmética avançada de botões (Skins completas por tema).
- [ ] Rastreamento de janela ativa para alternância automática de perfis.
- [ ] Módulo experimental de webcam virtual via WebRTC.
