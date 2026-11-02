# Changelog

Todas as mudanças relevantes no projeto serão documentadas neste arquivo.

## [Unreleased]
### Fixed
- **Trava de Responsividade e Proteção da Sidebar**:
  - Implementação de trava estrita de expansão da `Sidebar.tsx` quando `window.innerWidth < 1100px` (ou proporção de tela <= 4:3.4), assegurando largura saudável contínua para a Área Central e o Mobile Preview (`320px`).
  - Auto-colapso automático ao redimensionar para baixo de 1100px e desativação do botão de expansão (`disabled`, estilo pontilhado e opacidade atenuada com tooltip explicativo `"Aumente a largura da janela para expandir o menu"`).
  - Restauração dinâmica e automática do controle de alternância manual quando a janela atinge `>= 1100px`.
- **Limpeza Visual e Polimento na Tela "Páginas e Botões"**:
  - Remoção do badge técnico `"D&D + IPC Active"` e da etiqueta redundante `"Página ID: #X"`.
  - Remoção do indicador redundante de slots no header (`"{pageButtons.length} slots"`), mantendo a linha de busca limpa e despoluída.
  - Ajuste de responsividade no banner superior: título `"Grade de Botões com Drag-and-Drop Reativo"` configurado com quebra fluida (`whitespace-normal break-words`), permanecendo 100% visível e legível mesmo com a janela compactada e a barra lateral recolhida.
- **Temas Escuros & AMOLED na Personalização e Grade Central**:
  - Correção na troca de temas em `AppearanceView.tsx`: selecionar qualquer tema nativo (`escuro`, `amoled`, `claro`, `sistema`) agora limpa `custom_bg_hex` residual e remove `--app-bg-custom` no DOM, permitindo a transição plena entre os modos escuros e AMOLED sem sobreposição de fundo estático.
  - Correção do palco de demonstração em `AppearanceView.tsx` para respeitar o fundo preto puro (`#000000`) em modo AMOLED.
  - Sincronização do elemento raiz de `CentralArea.tsx` para responder fielmente a `appearance.custom_bg_hex` e às classes dinâmicas de tema.
- **Estabilização de Redimensionamento e Prevenção de Extravasamento**:
  - Ajuste no ponto de quebra de colapso automático da `Sidebar.tsx` (1040px / proporção 4:3.4) para garantir espaço horizontal contínuo e estável para a área central em resoluções mínimas (800x540 e 1024x768).
  - Adição de `viewport` e `overflowCheck` no harness de teste ao vivo `probe.mjs` para validação matemática de extravasamento de layout.
### Added
- **Agente `tester` e teste ao vivo (`tools/live-test/`)**:
  - Persona `.agents/tester.md`: congela critérios de aceite em cenário, opera o app Tauri real (clique, digitação, arrasto, snapshot de acessibilidade, prints) e só libera a entrega com `PASS`.
  - Harness `probe.mjs` (playwright-core via CDP do WebView2) + `start-app.ps1` / `stop-app.ps1`; evidência automática (snapshot + print) na falha.
  - Orçamento anti-loop: 3 ciclos corrigir→testar, falha idêntica 2× exige hipótese nova, limites de prints/tempo; estourou → entrega `NÃO RESOLVIDO`.
  - Pipeline, Definição de Pronto e `[RELATÓRIO DE ENTREGA]` (campo Status) atualizados.
- **Épico E7 (Descoberta Automática de Rede na LAN - Zeroconf / UDP Beacon / HTTP Discovery)**:
  - Endpoints HTTP `/discovery` e `/health` no servidor Axum (`desktop/src-tauri/src/server.rs`) retornando metadados de pareamento (`app`, `name`, `ip`, `ws_url`).
  - Responder e beacon UDP na porta 8081 para anúncio e descoberta Zeroconf em tempo real na rede local.
  - Serviço de descoberta no mobile (`mobile/src/services/discoveryService.ts`) com varredura assíncrona concorrente em lote de sub-redes candidatas.
  - Botão e indicador de progresso na tela de pareamento mobile (`HomeScreen.tsx`), permitindo conexão instantânea ao Stream Desk sem necessidade de apontar a câmera para o QR Code.
- **Épico E6 (Integração Nativa com OBS Studio WebSocket v5)**:
  - Módulo nativo `desktop/src-tauri/src/obs.rs` com suporte ao protocolo OBS WebSocket v5: autenticação por hash SHA256/Base64 (`Hello` op 0 -> `Identify` op 1 -> `Identified` op 2), envio de requisições (`Request` op 6) e leitura assíncrona de respostas (`RequestResponse` op 7).
  - Persistência das configurações OBS (`obs_host`, `obs_port`, `obs_password`, `obs_enabled`) no SQLite (`db.rs`).
  - Comandos IPC Tauri `get_obs_settings`, `set_obs_settings`, `test_obs_connection` e `execute_obs_action`.
  - Execução de comandos OBS via macros de botões (`obs:toggle_record`, `obs:toggle_stream`, `obs:switch_scene:<cena>`, `obs:toggle_mute:<fonte>`) tanto a partir da interface Desktop quanto pelo celular via WebSocket.
  - Interface do usuário em `IntegrationsView.tsx` com gaveta lateral (`Sheet`) para teste imediato de conexão, configuração de credenciais e alternância de estado ativo/inativo.
  - Inclusão do tipo de ação `obs` e ícone `video` no `ButtonEditorSheet.tsx` e `MobileIcon.tsx`.
- **Épico E8 (Limpeza Técnica e Otimização de Bundling com Code-Splitting)**:
  - Remoção de componente obsoleto e órfão `ButtonEditorView.tsx` (edição de botões já unificada no `ButtonEditorSheet`).
  - Configuração de `manualChunks` no Rollup/Vite (`desktop/vite.config.ts`) separando `vendor-react`, `vendor-dnd`, `vendor-lucide`, `vendor-radix` e `vendor-tauri`.
  - Redução drástica do tamanho dos chunks: nenhum bundle excede 325 kB, eliminando avisos de minificação (> 500 kB) e acelerando o tempo de build em ~45%.
- **Épico E4 (Lista Real de Dispositivos Conectados e Desconexão pelo Servidor)**:
  - Gerenciamento de sessões ativas no servidor Axum WebSocket (`ServerState`, `ClientSession`, `ConnectedDevice` em `desktop/src-tauri/src/server.rs`) com rastreamento de IP remoto, horário de conexão e canais individuais de desconexão.
  - Suporte ao comando de identificação de dispositivo (`identify`) do cliente mobile enviando plataforma amigável ("Stream Desk (iOS)", "Stream Desk (Android)").
  - Comandos IPC Tauri `get_connected_devices` e `disconnect_device(id)` para consulta em tempo real e terminação remota de conexões indesejadas.
  - Integração no Zustand do Desktop (`fetchConnectedDevices`, `disconnectDevice`) e atualização da `ConnectionView.tsx` com polling a cada 2.5s, substituindo a lista estática mockada por clientes reais.
- **Épico E2 (Iniciar com o Windows e Minimizar para a Bandeja)**:
  - Integração nativa com a bandeja do sistema (`TrayIconBuilder`, menu de contexto com "Abrir Stream Desk" e "Sair") e restauração rápida ao clicar com o botão esquerdo.
  - Interceptação de evento `CloseRequested` da janela principal para ocultar em background na bandeja (`minimize_to_tray`) quando configurado.
  - Autostart nativo no Windows via chaves do Registro (`HKCU\Software\Microsoft\Windows\CurrentVersion\Run`) com flags silenciosas sem popups de terminal.
  - Persistência e binding total no Zustand e UI em `SystemView.tsx` (`get_system_settings`, `set_system_settings`), eliminando os antigos fallbacks "Em breve".
- **Épico E3 (Importação e Restauração de Backup JSON)**:
  - Validador de schema com Zod (`desktop/src/lib/backupSchema.ts`) cobrindo `pages`, `buttons`, `windowRules`, `appearance` e `theme`.
  - Comando IPC Tauri `import_backup` com execução atômica via transação SQLite (`restore_backup` em `db.rs`), limpando com segurança as tabelas antes de popular e garantindo integridade referencial.
  - Broadcast automático imediato via WebSocket (`sync_layout`) após a restauração do backup.
  - Integração do botão "Importar" em `SystemView.tsx` com input de arquivo oculto, leitura assíncrona, validação com toasts de erro descritivos e atualização instantânea de toda a interface.
- **Épico E5 (Toggle Ativo/Inativo de Regras de Auto-Profile)**:
  - Migração de banco adicionando coluna `enabled INTEGER DEFAULT 1` na tabela `window_rules` do SQLite (`desktop/src-tauri/src/db.rs`).
  - Comando IPC Tauri `toggle_window_rule` para alternar o estado de ativação de regras sem removê-las da base de dados.
  - O monitor de janelas ativas (`server.rs`) agora filtra e executa apenas regras com `enabled == true`.
  - Conexão do componente `AutoProfileView.tsx` e `useDashboardStore.ts` com o `Switch` e `Trash2`: alternar o switch desativa/ativa a regra com feedback visual atenuado (`opacity-60`) e toasts informativos; o botão de lixeira executa a exclusão definitiva.
- **Épico E1 (Persistência e Sincronização de Aparência)**:
  - Persistência das configurações de aparência (`active_theme`, `accent_color`, `grid_columns`, `vibration_enabled`, `icon_style`) na tabela `settings` do SQLite (`desktop/src-tauri/src/db.rs`).
  - Comandos IPC no Tauri (`get_appearance_settings`, `set_appearance_settings`) com broadcast em tempo real via WebSocket (`broadcast_current_layout`).
  - Sincronização bidirecional no Zustand do Desktop (`AppearanceView.tsx` e `useDashboardStore.ts`).
  - Consumo completo no Mobile (`themeStore.ts`, `websocketService.ts`, `HomeScreen.tsx`, `DeckButton.tsx`, `MobileIcon.tsx`): grade adaptativa configurável de 2 a 6 colunas, controle real de vibração ao tocar (feedback háptico ativado/desativado), estilo de ícones (linha vs preenchido) e propagação da cor de destaque.
### Changed
- Início da Fase 3: o fluxo agêntico passa a ser interno no Antigravity:
  - **Fim do modelo duplo agêntico:** removido o handoff para o Gemini web como PM externo. O `[RELATÓRIO DE SINCRONIZAÇÃO PARA O GEMINI]` foi substituído pelo `[RELATÓRIO DE ENTREGA]` (`GEMINI.md`).
  - **Nova persona `orchestrator`:** Tech Lead/PM interno responsável por plano, contrato IPC/WS, delegação e gate final (`.agents/orchestrator.md`).
  - **Personas reescritas** (`backend_desktop`, `frontend_designer`, `frontend_mobile`, `debugger`, `version_controller`) com território por camada, padrões obrigatórios e gates objetivos. `src-tauri/` deixa de estar congelado e passa a pertencer exclusivamente ao `backend_desktop`.
  - **`global_rules.md` consolidado** com a Definição de Pronto (cargo check / npm run build / tsc --noEmit / contrato / changelog / commit).
### Added
- Início da Fase 2: Design UI/UX Profissional e Setup Tailwind CSS:
  - **Novo Agente Especialista (`.agents/frontend_designer.md`):** Arquiteto UI/UX focado em React, Tailwind CSS, shadcn/ui e `lucide-react`, com regra de ouro de isolamento estrito do backend Rust.
  - **Infraestrutura de Estilização Moderna:** Instalação e configuração do Tailwind CSS v3, PostCSS, Autoprefixer, `clsx`, `tailwind-merge` e pacote de ícones `lucide-react` no projeto Desktop (`desktop/tailwind.config.js`, `postcss.config.js`, `App.css`).
  - **Esqueleto do Layout de 3 Colunas:** Implementação do layout base de alta densidade visual em `desktop/src/App.tsx` com Sidebar esquerda fixa (240px), Área central dinâmica e fluida (`flex-1`) e Painel direito de simulação em tempo real do celular (320px - Mobile Live Preview).
### Added
- Scanner Automático de Aplicativos do Windows com Extração de Ícones Base64:
  - **Módulo Nativo `app_scanner.rs`:** Varredura rápida e resiliente das pastas do Menu Iniciar (%APPDATA% e %ProgramData%) e Desktops (Público e Usuário) com limitação de profundidade para máxima performance.
  - **Extração de Metadados e Resolução de Atalhos:** Parsing de arquivos `.lnk` com a crate `lnk` identificando o nome amigável e o executável alvo (ex: `chrome.exe`, `Spotify.exe`), além de filtragem inteligente de desinstaladores e manuais.
  - **Extração de Ícones em Base64:** Integração com a crate `windows-icons` gerando ícones em tamanho 48x48 (`IconSize::Medium`) formatados como Data URI PNG (`data:image/png;base64,...`).
  - **Comando Tauri Assíncrono (`get_installed_apps`):** Executado em threadpool de bloqueio (`tokio::task::spawn_blocking`) em `desktop/src-tauri/src/lib.rs`, garantindo que a varredura não bloqueie a thread principal da UI nem o servidor WebSocket.
### Added
- Drag-and-Drop Cruzado entre Páginas (Cross-Page DND):
  - **Abas como Zonas de Drop (Droppable Tabs):** Cada aba de página (`Tabs`) agora opera como um alvo `<Droppable droppableId={`tab-${id}`}>`, permitindo soltar botões diretamente sobre a aba de destino com destaque visual pulsante (`.drop-target`).
  - **Alternância Automática de Página por Hover:** Implementado `onDragUpdate` com timer de 500ms no `<DragDropContext>`. Ao pairar o botão sobre qualquer aba durante o arrasto, a visualização da grade alterna automaticamente para a nova página sem soltar o clique, permitindo posicionar o botão em qualquer índice da nova página.
  - **Prevenção de Unmount do Draggable:** Memoização com `useMemo` em `currentPageButtons` retendo temporariamente o botão em trânsito montado no DOM para evitar quebras de sessão no `@hello-pangea/dnd`.
  - **Persistência Atômica de Migração e Posições:** Envio em lote das novas posições e do novo `page_index` para o comando Tauri `update_button_positions` (`UPDATE buttons SET position = ?1, page_index = ?2 WHERE id = ?3`), disparando broadcast imediato via WebSocket para os dispositivos Mobile conectados.
### Fixed
- Correções do Auto-Profile e Contenção de Drag-and-Drop:
  - **Exclusão de Regras de Auto-Profile no Desktop:** Corrigido CSS onde `.delete-btn` dentro de `.rule-badge-card` herdava posicionamento absoluto do container global, tornando o botão invisível e inalcançável; adicionado `position: static !important;`, cursor explícito e atualização otimista imediata na UI (`App.tsx`, `App.css`).
  - **Case-Insensitive e Normalização em Regras (Spotify vs Chrome):** Tratamento abrangente no `server.rs` normalizando processo, executável (`exe_base`), nome da aplicação (`app_base`) e regra de banco para minúsculo, removendo sufixos `.exe` e cobrindo detecção mesmo quando aplicativos como Spotify são identificados pelo título da janela ou processo em background.
  - **Contenção Visual de Drag-and-Drop:** Adicionado container delimitador `.deck-grid-container` e `.deck-card` com `overflow: hidden`, contenção no `body` e `.container` com `overflow-x: hidden`, e remoção de `transform: scale` em `.deck-item.dragging` que conflitava com os cálculos de translação do `@hello-pangea/dnd`, eliminando vazamentos de scroll e distorções de tela.
### Fixed
- Auditoria Estática Inicial e Blindagem de Estabilidade (Debugger QA):
  - **Deleção de Páginas & Integridade Referencial:** Proteção no SQLite (`desktop/src-tauri/src/db.rs`) impedindo a exclusão da última página restante e remoção em cascata de regras de `window_rules` vinculadas à página excluída.
  - **Prevenção de Índice Órfão no Mobile:** Adicionado clamp de `currentPage` na `HomeScreen.tsx` para garantir que a exclusão da página ativa reposicione imediatamente a visualização na última página válida sem crashar o `<PagerView>`.
  - **Correção de Stale Closure no Auto-Profile:** Resolução de closure desatualizada no listener `onPageChange` na `HomeScreen.tsx`, lendo o estado mais recente via `useThemeStore.getState().pages`.
  - **Sanitização do Loop Auto-Profile:** Blindagem no `server.rs` contra processos com nomes nulos ou vazios no Windows, prevenindo comparações com `.exe` ou prefixos falsos.
  - **Resiliência e Timeout em Macros:** Adição de timeout explícito de 5 segundos via `reqwest::Client` em webhooks assíncronos e validação de strings vazias, além de avisos estruturados para hotkeys com teclas finais desconhecidas no `enigo`.

### Added
- Agente Especialista de Qualidade e Diagnóstico (`.agents/debugger.md`) para triagem de bugs, auditoria estática e prevenção de regressões full-stack.
### Added
- Mobile QoL: Tela Sempre Ativa e Reconexão Automática com Heartbeat:
  - Adição da biblioteca `expo-keep-awake` e integração do hook `useKeepAwake()` na `HomeScreen.tsx` para impedir o bloqueio/suspensão de tela enquanto o Stream Desk estiver em primeiro plano.
  - Heartbeat periódico a cada 30 segundos no `websocketService.ts` (`{"action": "ping"}`) garantindo que a conexão permaneça ativa.
  - Reconexão automática resiliente com timer de 3000ms após quedas de Wi-Fi ou erros inesperados, respeitando a flag `isManualDisconnect` ao desconectar manualmente.
  - Tratamento silencioso da ação `ping` no servidor Desktop (`desktop/src-tauri/src/server.rs`), mantendo o socket ativo sem acionar macros.

### Added
- Páginas Dinâmicas e Reordenação livre via Drag-and-Drop:
  - Tabela `pages` no SQLite (`desktop/src-tauri/src/db.rs`) com injeção automática da página padrão "Principal" e migração segura dos dados existentes.
  - Coluna `position INTEGER DEFAULT 0` na tabela `buttons` com ordenação determinística (`ORDER BY position ASC, id ASC`).
  - Comandos Tauri de CRUD de páginas (`get_pages`, `add_page`, `update_page`, `delete_page`) e salvamento em lote de posições (`update_button_positions`).
  - Broadcast do layout atualizado enviando objeto composto com `pages` e `buttons` no WebSocket (`broadcast_current_layout` e `get_layout`).
  - Drag-and-drop de botões no Dashboard Desktop (`desktop/src/App.tsx`, `App.css`) via `@hello-pangea/dnd` com feedback visual e atualização otimista.
  - Gerenciador dinâmico de abas de páginas no Desktop com botões de criação rápida (`+ Nova Página`), renomeação (✏️) e exclusão (✕).
  - Estado global mobile sincronizado (`mobile/src/store/themeStore.ts`, `websocketService.ts`) armazenando `pages: PageItem[]`.
  - Remoção da limitação fixa de 3 páginas no Mobile (`mobile/src/screens/HomeScreen.tsx`), renderizando dinamicamente as páginas do `<PagerView>` e ordenando os botões por `position`.

### Added
- Rastreamento de Janela Ativa (Auto-Profile) com a crate `active-win-pos-rs` no Backend Desktop (`desktop/src-tauri/Cargo.toml`, `server.rs`):
  - Task assíncrona periódica (1000ms) monitorando o aplicativo/processo em foco no Windows e efetuando broadcast do evento de troca de página `{"event": "page_change", "page_index": X}` via WebSocket para os dispositivos conectados.
  - Tabela `window_rules` no SQLite (`desktop/src-tauri/src/db.rs`) com funções CRUD `get_window_rules`, `add_window_rule` e `delete_window_rule`.
  - Exposição dos comandos Tauri `get_window_rules`, `add_window_rule` e `delete_window_rule` em `desktop/src-tauri/src/lib.rs`.
- Seção visual "Auto-Profile (Troca Automática)" no Dashboard Desktop (`desktop/src/App.tsx`, `App.css`) com formulário para cadastro de regras por nome de executável/processo e página de destino, além de listagem com exclusão.
- Parser e ouvinte de eventos `page_change` no serviço WebSocket do Mobile (`mobile/src/services/websocketService.ts`), acionando deslizamento visual imediato via `pagerRef.current?.setPage(novaPagina)` no `<PagerView>` de `mobile/src/screens/HomeScreen.tsx`.

### Added
- Suporte a Combinações de Teclas Complexas (Hotkeys) no motor de automação (`desktop/src-tauri/src/server.rs`): prefixo `hotkey:` com suporte a múltiplos modificadores (`Ctrl`, `Alt`, `Shift`, `Win`) e teclas de função/alfanuméricas via `enigo` (`Direction::Press`, `Click` e `Release`).
- Reorganização do seed inicial padrão no SQLite (`desktop/src-tauri/src/db.rs`) dividindo atalhos por finalidade: Página 1 (Apps e Sistema: Calculadora, Navegador, Terminal, Tarefas) e Página 2 (Mídia e Áudio: Volume +, Volume -, Mute, Play/Pause, Próxima, Anterior).
- Opção "Atalho de Teclado (Hotkey)" no formulário do painel Desktop (`desktop/src/App.tsx`) com input específico de combinações (ex: `Ctrl+Shift+Escape`, `Alt+F4`, `Ctrl+C`).

### Fixed
- Recalibragem matemática completa da grade responsiva no Mobile (`mobile/src/screens/HomeScreen.tsx` e `mobile/src/components/DeckButton.tsx`):
  - Definição precisa de colunas (`COLUMNS = isLandscape ? 4 : 3`).
  - Cálculo de largura e altura descontando margens (`6px` por lado) e padding do container, eliminando overflow e corte de botões na horizontal.
  - No modo landscape, limitação estrita da altura em `Math.min(buttonWidth, (height - 100) / 2 - 12)` para garantir a visualização das duas linhas completas.
  - Ícone dinâmico escalável e rótulo do botão com `adjustsFontSizeToFit` e `numberOfLines={1}` evitando quebras e vazamento de texto.
- Correção no container e renderização do `<PagerView>` em `mobile/src/screens/HomeScreen.tsx` para mapear de forma fixa as 3 páginas (`PAGES = [0, 1, 2]`) com `flex: 1`, filtragem `(b.page_index || 0) === pageIndex` e feedback visual de dots, corrigindo o deslizamento lateral por swipe.

### Added
- Suporte a modo paisagem (landscape) e rotação dinâmica de tela no Mobile (`mobile/app.json` configurado para `orientation: default`).
- Adaptação dinâmica de grade para 2 linhas de botões no modo horizontal (`useWindowDimensions` e cálculo de proporção em `mobile/src/screens/HomeScreen.tsx`), repassando `buttonWidth` e `buttonHeight` para o componente `DeckButton.tsx`.
- Header e indicadores de página compactos para visualização e aproveitamento máximo de tela em landscape.

### Added
- Motor de Ações Avançadas no Desktop (`desktop/src-tauri/src/server.rs`): suporte dinâmico a prefixos `open_url:<link>` (abertura de links no navegador via `open::that`) e `open_app:<app>` (abertura de executáveis e scripts com fallback via `std::process::Command`), e novas teclas de multimídia (`mute`, `media_play`, `media_next`, `media_prev`).
- Seletor avançado de macros com campo de parâmetros condicionais no Dashboard Desktop (`desktop/src/App.tsx`), permitindo configurar sites, apps, scripts e atalhos multimídia de forma visual.
- Paginação de botões no SQLite com coluna `page_index INTEGER DEFAULT 0` (`desktop/src-tauri/src/db.rs` e `lib.rs`) e envio no payload de broadcast.
- Seletor de páginas por abas ("Página 1", "Página 2", "Página 3") no Dashboard Desktop (`desktop/src/App.tsx`, `App.css`) com injeção automática de `page_index` e filtragem local da grade.
- Navegação fluida por deslizamento lateral (swipe) no Mobile utilizando `react-native-pager-view` (`mobile/src/screens/HomeScreen.tsx`), com agrupamento de páginas, telas vazias orientativas e indicador de pontos (dots).
- Recurso de edição completa de botões (Update CRUD) com a função `update_button` em `desktop/src-tauri/src/db.rs` e comando Tauri `update_button` em `lib.rs` com disparo de broadcast em tempo real.
- Interface de edição no Dashboard Desktop (`desktop/src/App.tsx`, `App.css`) com botão de editar (✏️) na grade, preenchimento automático do formulário, alteração de ação para "Salvar Alteração" e botão de cancelamento.
- Feedback Háptico tátil no Mobile via `expo-haptics` acionado no `onPressIn` de `mobile/src/components/DeckButton.tsx` (`Haptics.impactAsync(ImpactFeedbackStyle.Medium)`).
- Suporte a ícones dinâmicos no SQLite (`buttons.icon`) com migração suave (`ALTER TABLE buttons ADD COLUMN icon TEXT DEFAULT 'zap'`) e seed atualizado com ícones contextuais (`desktop/src-tauri/src/db.rs`, `lib.rs`).
- Seletor de ícones (`volume-2`, `volume-x`, `mic-off`, `play`, `calculator`, etc.) e visualização de badge de ícone no painel Desktop (`desktop/src/App.tsx`, `App.css`).
- Fundo em gradiente por Skin com `expo-linear-gradient` (`backgroundGradient` adicionado a cada definição em `mobile/src/theme/skins.ts` e aplicado em `HomeScreen.tsx`).
- Barra de cabeçalho com `<BlurView>` para temas glass (`HomeScreen.tsx`).
- Renderização de ícones dinâmicos Feather via `@expo/vector-icons` centralizados acima do label em `mobile/src/components/DeckButton.tsx`.
- Pareamento dinâmico por QR Code no Mobile (`mobile/src/screens/HomeScreen.tsx` e `mobile/src/services/websocketService.ts`) utilizando `CameraView` (`expo-camera`) e persistência da chave `@streamdesk_ws_url` no `AsyncStorage`, eliminando o IP hardcoded e adicionando o botão "Desconectar" para novo pareamento.
- Descoberta nativa do IP IPv4 local na LAN via crate `local-ip-address` (`get_local_ip` em `desktop/src-tauri/src/lib.rs`).
- Área de conexão no Dashboard Desktop (`desktop/src/App.tsx` e `App.css`) renderizando o QR Code dinâmico (`ws://${localIp}:8080/ws`) com `react-qr-code` e exibindo o endereço IP local ao lado.
- Dicionário de Skins (`mobile/src/theme/skins.ts`) mapeando os conceitos visuais (`apple`, `windows`, `steam`, `oneui`, `chromebook`, `default`) com tipos (`glass`, `solid`, `flat`), raios de borda, cores e sombras.
- Refatoração do `DeckButton.tsx` no Mobile com `expo-blur` (`<BlurView>` para temas `glass`) e animações específicas via `react-native-reanimated` (`withSpring` na escala para `apple`/`windows`, corte seco `withTiming` invertendo cores para `steam`, e efeito Ripple + elevação de sombra para `oneui`/`chromebook`).
- Remoção permanente do seletor de temas local na `HomeScreen.tsx` do Mobile, consolidando o modelo "Dumb Client" onde apenas o Desktop controla a Skin ativa.
- Tabela `settings` no SQLite (`desktop/src-tauri/src/db.rs`) com seed inicial `active_theme = 'default'` e funções `get_active_theme` / `set_active_theme`.
- Comandos Tauri `set_theme` e `get_theme` (`desktop/src-tauri/src/lib.rs`) e seletor de tema global (`default`, `apple`, `steam`, `gamer`) no Dashboard React (`desktop/src/App.tsx`).
- Atualização do contrato de payload do evento `sync_layout` (`lib.rs`, `server.rs` e `mobile/src/services/websocketService.ts`) para enviar e processar `{ theme, buttons }`, aplicando automaticamente o tema e os botões nos stores do Mobile (`useDeckStore` e `useThemeStore`).

### Changed
- Refinamento arquitetural das diretrizes (`global_rules.md`, `.agents/backend_desktop.md`, `.agents/frontend_mobile.md` e migração de `.agentes/` para `.agents/`) consolidando o modelo "Dumb Client / Smart Server" e sincronização orientada a eventos ("State Sync").

### Fixed
- Alinhamento das opções do seletor de temas (`<select>`) no Dashboard Desktop (`desktop/src/App.tsx`) para refletir estritamente o dicionário de Skins do Mobile (`default`, `apple`, `windows`, `steam`, `oneui`, `chromebook`).
- Atualização do `iniciar.bat` com `taskkill` para encerrar processos órfãos (`node.exe` e `desktop.exe`) antes de iniciar o Tauri e o Expo, resolvendo o erro `Port 1420 is already in use`.
- Fixação explícita do endereço WebSocket da máquina host (`ws://192.168.1.97:8080/ws`) em `mobile/src/services/websocketService.ts`.

### Added
- Canal de broadcast (`tokio::sync::broadcast::channel::<String>(100)`) gerenciado no estado global do Tauri (`lib.rs`) e integrado ao loop `tokio::select!` do servidor WebSocket Axum (`server.rs`).
- Disparo automático de `sync_layout` em tempo real para todos os clientes Mobile conectados sempre que `add_button` ou `delete_button` são executados no Desktop.
- Funções CRUD no SQLite (`add_button` e `delete_button` em `desktop/src-tauri/src/db.rs`) e exposição dos comandos Tauri (`get_buttons`, `add_button`, `delete_button` em `lib.rs`).
- Interface de gerenciamento (CRUD) de botões no cliente React do Desktop (`desktop/src/App.tsx` e `App.css`) permitindo listar, criar (com seletor de cor e sugestões de macro) e excluir botões persistidos no SQLite.
- Persistência local em SQLite no Desktop (`desktop/src-tauri/src/db.rs`) com `rusqlite` (`bundled`), criando o banco `streamdesk.db`, tabela `buttons` e seed inicial automático dos 4 botões padrão.
- Rota de sincronização no WebSocket do Desktop (`server.rs`): tratamento da action `get_layout` retornando a lista de botões do SQLite no payload de `sync_layout`.
- Estado dinâmico de botões no Mobile (`themeStore.ts` / `deckStore.ts`), disparo automático de `get_layout` no `onopen` do `websocketService.ts` e renderização dinâmica via `.map()` na `HomeScreen.tsx`.
- Integração das crates `enigo` e `open` no Desktop (`desktop/src-tauri/src/server.rs`) para controle de teclas de multimídia (`vol_up`, `vol_down`, `play_pause`) e abertura de aplicativos do sistema (`open_calc`).
- Mapeamento de 4 botões funcionais na `HomeScreen.tsx` do Mobile conectando as ações `vol_up`, `vol_down`, `play_pause` e `open_calc` ao servidor WebSocket do Desktop.
- Script de inicialização automática `iniciar.bat` na raiz do monorepo para iniciar simultaneamente o servidor Desktop (Tauri) e o app Mobile (Expo).
- Servidor WebSocket Axum no Desktop (`desktop/src-tauri/src/server.rs`) escutando na porta `8080` (`/ws`), processando mensagens de texto em JSON e respondendo com status de confirmação.
- Serviço cliente WebSocket nativo no Mobile (`mobile/src/services/websocketService.ts`) com envio de comandos `{ action, payload }` e tratamento de status.
- Integração da `HomeScreen.tsx` para conectar ao WebSocket e acionar `teste_ping` / comandos via `DeckButton`.
- Implementação da UI do Mobile (`DeckGrid.tsx`, `DeckButton.tsx`) e gerenciamento de estado de temas com Zustand (`themeStore.ts` e paletas `default`, `ios`, `windows`, `gamer` em `colors.ts`).
- Atualização da `HomeScreen.tsx` no Mobile com grade interativa de botões e seletor de temas no rodapé.
- Inicialização do projeto Desktop (`desktop/`) com Tauri v2 e template React + TypeScript (`react-ts`).
- Adição das dependências do servidor local Rust em `desktop/src-tauri/Cargo.toml`: `tokio` (`full`), `axum` (`ws`), `serde` e `serde_json`.
- Estrutura base assíncrona (`tauri::async_runtime::spawn`) em `desktop/src-tauri/src/lib.rs` e `main.rs`, além da interface inicial em `desktop/src/App.tsx`.
- Inicialização do projeto Mobile (`mobile/`) com Expo e TypeScript (`expo-template-blank-typescript`).
- Instalação de dependências base no Mobile: `zustand`, `react-native-reanimated` e `react-native-gesture-handler`.
- Estrutura modular inicial em `mobile/src/` (`components`, `screens`, `store`, `services`, `theme`) e tela inicial `HomeScreen.tsx`.
- Estrutura base do monorepo (`mobile/`, `desktop/`, `docs/`, `.agentes/`, `.github/`).
- Documentos de regras globais e arquitetura inicial.

