# Changelog

Todas as mudanças relevantes no projeto serão documentadas neste arquivo.

## [Unreleased]
### Added
- Script de inicialização automática `iniciar.bat` na raiz do monorepo para iniciar simultaneamente o servidor Desktop (Tauri) e o app Mobile (Expo).
- Servidor WebSocket Axum no Desktop (`desktop/src-tauri/src/server.rs`) escutando na porta `8080` (`/ws`), processando mensagens de texto em JSON e respondendo com status de confirmação.
- Serviço cliente WebSocket nativo no Mobile (`mobile/src/services/websocketService.ts`) com envio de comandos `{ action, payload }` e tratamento de status.
- Integração da `HomeScreen.tsx` para conectar ao WebSocket e acionar `teste_ping` / comandos via `DeckButton`.
- Implementação da UI do Mobile (`DeckGrid.tsx`, `DeckButton.tsx`) e gerenciamento de estado de temas com Zustand (`themeStore.ts` e paletas `default`, `ios`, `windows`, `gamer` em `colors.ts`).
- Atualização da `HomeScreen.tsx` no Mobile com grade interativa de botões e seletor de temas no rodapé.
- Inicialização do projeto Desktop (`desktop/`) com Tauri v2 e template React + TypeScript (`react-ts`).
- Adição das dependências do servidor local Rust em `desktop/src-tauri/Cargo.toml`: `tokio` (`full`), `axum` (`ws`), `serde` e `serde_json`.
- Estrutura base assíncrona (`tauri::async_runtime::spawn`) em `desktop/src-tauri/src/lib.rs` e `main.rs`, além da interface inicial em `desktop/src/App.tsx`.
- Inicialização do projeto Mobile (`mobile/`) com Expo e TypeScript (`expo-template-blank-typescript`).
- Instalação de dependências base no Mobile: `zustand`, `react-native-reanimated` e `react-native-gesture-handler`.
- Estrutura modular inicial em `mobile/src/` (`components`, `screens`, `store`, `services`, `theme`) e tela inicial `HomeScreen.tsx`.
- Estrutura base do monorepo (`mobile/`, `desktop/`, `docs/`, `.agentes/`, `.github/`).
- Documentos de regras globais e arquitetura inicial.

