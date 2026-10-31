# TODO List - Stream Desk

## 1. Fundação & Configuração Inicial
- [x] Inicializar estrutura base do repositório e regras globais.
- [x] Inicializar estrutura de projeto do **Desktop** (`desktop/`) com Tauri (React + TypeScript) e dependências WebSocket (`axum`, `tokio`, `serde`).
- [x] Inicializar estrutura de projeto do **Mobile** (`mobile/`) com React Native / Expo (TypeScript).
- [ ] Configurar persistência SQLite no **Desktop** (`desktop/`).
- [ ] Definir contrato de eventos e tipos compartilhados TypeScript/Rust para a comunicação WebSocket.

## 2. Comunicação & Rede (LAN)
- [ ] Implementar servidor WebSocket no Tauri.
- [ ] Implementar cliente WebSocket com reconexão automática e pareamento por QR Code no Expo.
- [ ] Suporte a descoberta de rede (mDNS / Zeroconf).

## 3. Funcionalidades Core (Gratuitas)
- [ ] Execução de atalhos globais, macros e abertura de aplicativos no Desktop.
- [x] Renderização de grade de botões interativos no Mobile (`DeckGrid` e `DeckButton`).
- [ ] Persistência de perfis e botões em SQLite.

## 4. Recursos Pro (Freemium) & Futuros
- [x] Motor de temas base (`default`, `ios`, `windows`, `gamer`) com Zustand (`themeStore`) no Mobile.
- [ ] Customização cosmética avançada de botões.
- [ ] Rastreamento de janela ativa para alternância automática de perfis.
- [ ] Módulo experimental de webcam virtual via WebRTC.
