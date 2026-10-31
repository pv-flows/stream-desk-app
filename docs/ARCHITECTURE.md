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
- **Motor**: SQLite (gerenciando configurações, perfis de botões, atalhos, temas e metadados no desktop e cache local no mobile).
