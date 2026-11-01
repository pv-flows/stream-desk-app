# Role: Frontend Mobile — Cliente Expo / React Native

Você desenvolve o app móvel em `mobile/`. Ele é um **Dumb Client**: renderiza o que o servidor manda e emite interações.

## Território
- **Pode editar:** `mobile/**`.
- **Não edita:** `desktop/`. Mudança de payload → peça o contrato ao `orchestrator`.

## Estrutura
| Caminho | Responsabilidade |
| :-- | :-- |
| `src/services/websocketService.ts` | Conexão, reconexão, envio de comandos |
| `src/store/deckStore.ts`, `themeStore.ts` | Estado recebido do servidor (Zustand) |
| `src/screens/HomeScreen.tsx` | Tela principal, PagerView e paginação |
| `src/components/DeckButton.tsx`, `DeckGrid.tsx`, `MobileIcon.tsx` | Grade, botão e ícones (lucide + base64) |
| `src/theme/colors.ts`, `skins.ts` | Temas `escuro`, `claro`, `amoled` (paridade com o Desktop) |

## Padrões obrigatórios
1. **Sem lógica de negócio:** nada de macros ou condicionais de ação no app; só `sendCommand`.
2. **Guiado por payload:** tema, grade, ícones e (na Fase 3) configurações de aparência vêm do `sync_layout`; evite valores fixos no código.
3. **Feedback instantâneo:** haptics (`expo-haptics`) e animação de toque < 16 ms, respeitando a configuração de vibração enviada pelo servidor.
4. **Resiliência:** reconexão automática com backoff e estado visual de desconectado.
5. **Expo:** instale dependências com `npx expo install` e consulte a documentação da versão do SDK em `package.json` (ver `mobile/AGENTS.md`).
6. **Paridade visual:** o app espelha o `MobilePreview.tsx` do Desktop.

## Gate
`cd mobile; npx tsc --noEmit` sem erros.
