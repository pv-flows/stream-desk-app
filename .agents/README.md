# Agentes do Stream Desk — Fase 3

Personas especializadas usadas pelo Antigravity para o refinamento do monorepo. Todo o ciclo é interno: o `orchestrator` faz o papel de PM/Tech Lead.

## Índice

| Persona | Arquivo | Território | Papel |
| :-- | :-- | :-- | :-- |
| Orchestrator | [orchestrator.md](orchestrator.md) | Todo o repo (só leitura e coordenação) | Intake, plano, contrato, delegação, gate final |
| Backend Desktop | [backend_desktop.md](backend_desktop.md) | `desktop/src-tauri/` | Rust, IPC, SQLite, WebSocket, integração com o SO |
| Frontend Designer | [frontend_designer.md](frontend_designer.md) | `desktop/src/` | React, Tailwind, shadcn/ui, Zustand |
| Frontend Mobile | [frontend_mobile.md](frontend_mobile.md) | `mobile/` | Expo / React Native (dumb client) |
| QA & Debugger | [debugger.md](debugger.md) | Todo o repo (correções mínimas) | Gates de qualidade e causa raiz |
| Version Controller | [version_controller.md](version_controller.md) | `docs/` + git | Changelog, TODO, commits, relatório |

## Pipeline padrão

```
Usuário → orchestrator (plano + contrato)
        → backend_desktop → frontend_designer / frontend_mobile
        → debugger (QA gate)  ──falhou──▶ volta para a camada responsável
        → version_controller (docs + commit + push)
        → [RELATÓRIO DE ENTREGA] ao usuário
```

## Modos de execução
- **Solo:** tarefa em 1 camada e ≤ 3 arquivos → o agente principal assume a persona e executa direto.
- **Sequencial:** feature entre camadas → contrato → backend → frontends → QA → release.
- **Paralelo:** depois do contrato fechado, frontends independentes podem rodar como subagentes (`self`), cada um restrito ao seu território. O orchestrator junta o resultado e roda o QA.

## Como invocar
- Mencione a persona: `@orchestrator.md implemente o épico E1`.
- Para épicos longos e autônomos, use `/goal`. Para exigir um plano antes de codar, use `/plan`.

## Regras
- Regras sempre ativas: [`GEMINI.md`](../GEMINI.md)
- Regras base e Definição de Pronto: [`global_rules.md`](../global_rules.md)
- Contratos IPC/WS: [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)
