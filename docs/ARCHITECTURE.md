# Arquitetura do Sistema

## Visão Geral
Sistema de controle remoto estilo Stream Deck composto por:
1. **Desktop Client/Server**: Gerencia conexões, atalhos do sistema operacional, macros e integrações (Tauri/Rust ou Node).
2. **Mobile Client**: Interface touchscreen para acionamento rápido de botões e comandos via rede local (React Native / Expo).

## Comunicação
- **Protocolo**: WebSocket / HTTP local.
- **Descoberta de Serviços**: mDNS/Zeroconf ou entrada manual de IP e porta.

