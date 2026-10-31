# Regras Globais de Desenvolvimento (global_rules.md)

## 1. Organização do Monorepo
- O projeto divide responsabilidades entre `desktop/` e `mobile/`.
- Mantenha dependências isoladas em cada projeto (`desktop/package.json` vs `mobile/package.json`), a menos que seja adotado um gerenciador compartilhado como PNPM/Yarn Workspaces.
- Códigos e protocolos comuns (payloads de socket, contratos de mensagem) devem ser documentados em `docs/ARCHITECTURE.md`.

## 2. Padrões de Código e Versionamento
- **Commits Convencionais**: seguir formato `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, etc.
- **Git Flow / Trunk Based**: commits atômicos, descritivos e organizados.
- **Documentação Contínua**: qualquer alteração significativa em rotas, eventos WebSocket ou arquitetura deve ser refletida na pasta `docs/`.

## 3. Diretrizes de Qualidade
- Não versionar chaves de API, senhas ou arquivos de ambiente (`.env`).
- Manter `.gitignore` atualizado na raiz e nos subprojetos.
- Escrever código legível, fortemente tipado (TypeScript) e manutenível.
