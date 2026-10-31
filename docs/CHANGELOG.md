# Changelog

Todas as mudanças relevantes no projeto serão documentadas neste arquivo.

## [Unreleased]
### Added
- Inicialização do projeto Desktop (`desktop/`) com Tauri v2 e template React + TypeScript (`react-ts`).
- Adição das dependências do servidor local Rust em `desktop/src-tauri/Cargo.toml`: `tokio` (`full`), `axum` (`ws`), `serde` e `serde_json`.
- Estrutura base assíncrona (`tauri::async_runtime::spawn`) em `desktop/src-tauri/src/lib.rs` e `main.rs`, além da interface inicial em `desktop/src/App.tsx`.
- Inicialização do projeto Mobile (`mobile/`) com Expo e TypeScript (`expo-template-blank-typescript`).
- Instalação de dependências base no Mobile: `zustand`, `react-native-reanimated` e `react-native-gesture-handler`.
- Estrutura modular inicial em `mobile/src/` (`components`, `screens`, `store`, `services`, `theme`) e tela inicial `HomeScreen.tsx`.
- Estrutura base do monorepo (`mobile/`, `desktop/`, `docs/`, `.agentes/`, `.github/`).
- Documentos de regras globais e arquitetura inicial.

