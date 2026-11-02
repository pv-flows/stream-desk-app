# Regras Globais de Desenvolvimento — Stream Desk

## 1. Princípios de Arquitetura
1. **Fonte da Verdade (Smart Server):** o Desktop (Rust/SQLite) é a única fonte da verdade. Lógica de negócio, gatilhos condicionais e estado persistente ficam no backend.
2. **Client Burro (Dumb Client):** o Mobile só renderiza o payload JSON recebido e emite eventos de interação. Nada de regra de negócio no app.
3. **Orientação a Eventos:** toda mutação de estado no Desktop dispara broadcast imediato (`sync_layout` ou evento dedicado) para os clientes.
4. **Contrato primeiro:** payloads WebSocket e comandos IPC ficam documentados em `docs/ARCHITECTURE.md` (nome, parâmetros, retorno, se dispara broadcast).

## 2. Organização do Monorepo
- `desktop/src/` → frontend React (persona `frontend_designer`).
- `desktop/src-tauri/` → backend Rust (persona `backend_desktop`).
- `mobile/` → cliente Expo (persona `frontend_mobile`).
- `docs/` → arquitetura, changelog e TODO (persona `version_controller`).
- `tools/live-test/` → harness de teste ao vivo (persona `tester`).
- Dependências isoladas por projeto (`desktop/package.json`, `mobile/package.json`, `Cargo.toml`).

## 3. Padrões de Código
- **Idioma:** código, variáveis e commits em inglês. Documentação e textos de UI em português.
- **Modularidade:** funções pequenas, de responsabilidade única. UI separada de rede/IPC (IPC fica no store Zustand ou em `lib/`).
- **Tipagem forte:** TypeScript sem `any` implícito. No Rust, erros propagados como `Result<_, String>` nos comandos.
- **Tratamento de erros:** toda falha de rede/IPC registra log local (`console.error` / `eprintln!`) e mostra fallback visual (toast ou estado de erro).
- **Economia de contexto:** edições cirúrgicas; não reescreva arquivos inteiros sem necessidade.
- **Funcionalidade incompleta:** nunca deixe um controle morto. Use toast "Em breve" e registre o item no `docs/TODO.md`.

## 4. Definição de Pronto (Quality Gates)
Uma tarefa só termina quando todos os gates aplicáveis estão verdes:

| Gate | Comando | Quando |
| :-- | :-- | :-- |
| Rust compila | `cd desktop/src-tauri; cargo check` | Qualquer mudança em `src-tauri/` |
| Frontend Desktop | `cd desktop; npm run build` | Qualquer mudança em `desktop/src/` |
| Mobile typecheck | `cd mobile; npx tsc --noEmit` | Qualquer mudança em `mobile/` |
| Teste ao vivo | `tools/live-test/probe.mjs` com cenário da tarefa → `PASS` | Toda mudança com efeito visível ou de comportamento (persona `tester`) |
| Contrato | `docs/ARCHITECTURE.md` atualizado | Novo/alterado `invoke` ou evento WS |
| Rastreio | `docs/CHANGELOG.md` + `docs/TODO.md` | Toda entrega de feature/fix |
| Versionamento | Commit convencional atômico | Toda entrega |

**Compilar não é resolver.** Sem `PASS` no teste ao vivo, a tarefa só pode ser entregue como `NÃO RESOLVIDO` (orçamento anti-loop esgotado) ou com itens `BLOCKED` acompanhados de roteiro de verificação manual. Orçamento: 3 ciclos corrigir→testar por tarefa (ver `.agents/tester.md`).

## 5. Versionamento
- **Commits convencionais:** `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `perf:`, `test:` (escopo opcional: `feat(desktop): ...`).
- **Trunk-based:** commits atômicos na `main`; um épico pode ter vários commits, cada um compilando.
- Push para `origin/main` após os gates.

## 6. Segurança
- Não versionar chaves, tokens ou `.env`.
- Manter `.gitignore` atualizado na raiz e nos subprojetos.
- Operações destrutivas (drop de tabela, `git push --force`, apagar dados do usuário) exigem confirmação explícita do usuário.
