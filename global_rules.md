# Diretrizes Globais do Projeto Stream Deck

1. **Economia de Tokens:** Nunca reescreva blocos de código que não foram alterados. Use comentários como `// ... código existente ...` para omitir partes inalteradas. Responda apenas o que foi solicitado.
2. **Modularidade:** Mantenha funções pequenas (responsabilidade única). Isole a lógica de UI da lógica de rede.
3. **Protocolo de Sincronização:** Toda resposta de conclusão de tarefa DEVE terminar com o bloco "[RELATÓRIO DE SINCRONIZAÇÃO PARA O GEMINI]".
4. **Tratamento de Erros:** Todo erro de rede ou falha de WebSocket deve emitir logs locais e acionar um fallback visual no front-end.
5. **Idioma:** Código, variáveis e commits estritamente em Inglês. Documentação estrutural em Português.
6. **Fonte da Verdade (Smart Server):** O Desktop (Rust/SQLite) é a única fonte da verdade. Toda a lógica de negócios, gatilhos condicionais e gerenciamento de estado residem no backend.
7. **Client Burro (Dumb Client):** O Mobile (React Native) não deve processar lógica. Ele serve puramente para renderizar a interface baseada no payload JSON recebido e emitir eventos de interação (ex: clique no botão).
8. **Orientação a Eventos:** Qualquer alteração no estado do Desktop (novo botão, alteração de volume) deve ser disparada (broadcast) imediatamente para atualizar a UI do Mobile em tempo real.

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