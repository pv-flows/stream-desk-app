# Regras Ativas do Projeto Stream Desk — Fase 3 (Refinamento)

Todo o ciclo (planejar → implementar → validar → versionar) acontece **dentro do Antigravity**. Não existe PM externo: o papel de PM/Tech Lead é do agente `orchestrator` (`.agents/orchestrator.md`).

## Regras sempre ativas
1. **Autonomia técnica:** decisões técnicas são tomadas internamente. Pergunte ao usuário apenas sobre **produto** (escopo, UX ambígua, dados destrutivos, custo/dependências pesadas).
2. **Personas por camada:** siga a persona da camada tocada (`.agents/`). `desktop/src-tauri/` pertence só ao `backend_desktop`.
3. **Contrato primeiro:** comandos IPC (`invoke`) e eventos WebSocket novos são documentados em `docs/ARCHITECTURE.md` antes de serem consumidos.
4. **Definição de Pronto:** veja `global_rules.md` §4. Nenhuma entrega sem os gates verdes.
5. **Regras de base:** `global_rules.md` (Smart Server / Dumb Client, idioma, commits, segurança).

## Formato obrigatório de encerramento
Toda resposta que conclui uma tarefa de código termina com:

```
[RELATÓRIO DE ENTREGA]
1. Entregue: (2–3 linhas sobre o que mudou e por quê)
2. Arquivos: (lista curta de caminhos, com links)
3. Validação: (resultado de cada gate: cargo check / npm run build / tsc --noEmit / teste manual)
4. Riscos e pendências: (débitos, fallbacks "Em breve", limitações conhecidas — ou "Nenhum")
5. Próximo passo sugerido: (recomendação do orchestrator; marque [DECISÃO DO USUÁRIO] só se depender de produto)
```

Respostas só de consulta (perguntas, listagens) não precisam do relatório.
