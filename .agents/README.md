# Agentes do Stream Desk — Fase 3

Personas especializadas usadas pelo Antigravity para o refinamento do monorepo. Todo o ciclo é interno: o `orchestrator` faz o papel de PM/Tech Lead.

## Índice

| Persona | Arquivo | Território | Papel |
| :-- | :-- | :-- | :-- |
| Orchestrator | [orchestrator.md](orchestrator.md) | Todo o repo (só leitura e coordenação) | Intake, plano, contrato, delegação, gate final |
| Backend Desktop | [backend_desktop.md](backend_desktop.md) | `desktop/src-tauri/` | Rust, IPC, SQLite, WebSocket, integração com o SO |
| Frontend Designer | [frontend_designer.md](frontend_designer.md) | `desktop/src/` | React, Tailwind, shadcn/ui, Zustand |
| Frontend Mobile | [frontend_mobile.md](frontend_mobile.md) | `mobile/` | Expo / React Native (dumb client) |
| QA & Debugger | [debugger.md](debugger.md) | Todo o repo (correções mínimas) | Gates estáticos (compila) e causa raiz |
| Tester | [tester.md](tester.md) | `tools/live-test/` | Opera o app real (clica, arrasta, prints, snapshot) e dá o veredito PASS/FAIL |
| Version Controller | [version_controller.md](version_controller.md) | `docs/` + git | Changelog, TODO, commits, relatório |

## Pipeline padrão

```
Usuário → orchestrator (critérios observáveis + plano + contrato)
        → tester (congela critérios em cenário; bug: reproduz a falha)
        → backend_desktop → frontend_designer / frontend_mobile
        → debugger (gate estático)  ──falhou──▶ volta para a camada responsável
        → tester (gate ao vivo)     ──FAIL──▶ volta para a camada (máx. 3 ciclos)
                                    ──orçamento estourado──▶ entrega "NÃO RESOLVIDO" + pergunta
        → version_controller (docs + commit + push)   [só com PASS]
        → [RELATÓRIO DE ENTREGA] ao usuário
```

**Orçamento anti-loop:** 3 ciclos corrigir→testar por tarefa; falha idêntica 2× seguidas proíbe repetir a abordagem; máx. 2 prints abertos por ciclo (snapshot em texto primeiro). Detalhes em [tester.md](tester.md).

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
