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
- [x] Implementar descoberta de IP local nativa no Desktop (`local-ip-address`) e geração de QR Code de pareamento (`react-qr-code` em `desktop/src/App.tsx`).
- [x] Implementar leitor de QR Code (`expo-camera`), persistência da URL (`@react-native-async-storage/async-storage`) e conexão dinâmica WebSocket no Mobile (`HomeScreen.tsx` / `websocketService.ts`).
- [ ] Suporte a descoberta de rede (mDNS / Zeroconf).

## 3. Funcionalidades Core (Gratuitas)
- [x] Execução de atalhos globais, macros e abertura de aplicativos no Desktop (integração Enigo para teclas multimídia e crate Open para abrir calculadora).
- [x] Motor de Ações Avançadas no Desktop (`server.rs`): suporte aos prefixos `open_url:` (sites via browser padrão) e `open_app:` (aplicativos/scripts do SO), além de controles multimídia expandidos (`mute`, `media_play`, `media_next`, `media_prev`).
- [x] Renderização de grade de botões interativos no Mobile (`DeckGrid` e `DeckButton`) mapeados para macros do sistema.
- [x] Persistência de perfis e botões em SQLite (`streamdesk.db` com seed automático e sincronização dinâmica via WebSocket).
- [x] Interface CRUD completa no cliente React do Desktop (`get_buttons`, `add_button`, `update_button`, `delete_button`) integrada via Tauri Commands ao SQLite.
- [x] Suporte a ícones dinâmicos no SQLite (`icon` em `buttons`) e seleção na criação/edição de botões no Desktop.
- [x] Feedback Háptico físico no Mobile com `expo-haptics` (`Haptics.impactAsync(Medium)`) ao pressionar botões.
- [x] Paginação de botões no SQLite (`page_index INTEGER DEFAULT 0`) com abas de páginas no Desktop e navegação fluida por swipe via `<PagerView>` (`react-native-pager-view`) no Mobile.

## 4. Recursos Pro (Freemium) & Futuros
- [x] Motor de temas base (`default`, `apple`, `windows`, `steam`, `oneui`, `chromebook`) com Zustand (`themeStore`) no Mobile e seletor sincronizado no Desktop (`App.tsx`).
- [x] Persistência do tema ativo (`active_theme`) na tabela `settings` do SQLite e sincronização global em tempo real via payload `sync_layout` (`{ theme, buttons }`).
- [x] Motor de Estilos e Animações no Mobile (`skins.ts`, `BlurView` via `expo-blur` e animações táticas com `react-native-reanimated` em `DeckButton.tsx`) e remoção do seletor local no Mobile (`HomeScreen.tsx`).
- [x] Fundos em Gradiente por Skin (`expo-linear-gradient` com `backgroundGradient` no `skins.ts`) e renderização de ícones Feather (`@expo/vector-icons`) no `DeckButton.tsx`.
- [ ] Rastreamento de janela ativa para alternância automática de perfis.
- [ ] Módulo experimental de webcam virtual via WebRTC.
