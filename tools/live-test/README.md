# Live Test — harness do agente `tester`

Dirige o **app Tauri real** (WebView2 com depuração remota/CDP) via `playwright-core`. Backend Rust, SQLite e IPC são reais.

## Uso
```powershell
# 1x por clone
cd tools\live-test; npm install

# Subir o app (deixar rodando em background/daemon; aguarde "READY")
powershell -ExecutionPolicy Bypass -File tools\live-test\start-app.ps1

# Executar um cenário
cd tools\live-test; node probe.mjs scenarios\smoke.json

# Derrubar o app
powershell -ExecutionPolicy Bypass -File tools\live-test\stop-app.ps1
```
Opções do probe: `--continue` (não para no primeiro erro), `--port 9222`, `--target vite` (só layout no Edge headless, **sem IPC**).

Códigos de saída: `0` PASS · `1` FAIL/TIMEOUT · `2` erro de setup (app não está no ar).

## Formato do cenário
```json
{
  "name": "appearance-accent",
  "steps": [
    { "do": "click", "selector": "nav >> role=button[name='Aparência']", "label": "abrir Aparência" },
    { "do": "expect", "selector": "role=heading[level=1]", "text": "Aparência" },
    { "do": "snapshot", "selector": "main", "maxChars": 1500 },
    { "do": "screenshot", "name": "final" }
  ]
}
```

| Passo | Campos | Uso |
| :-- | :-- | :-- |
| `click` / `dblclick` / `hover` | `selector`, `button?`, `clicks?` | Interação |
| `fill` / `type` | `selector`, `value` | `fill` substitui; `type` digita tecla a tecla |
| `press` | `key`, `selector?` | `Enter`, `Escape`, `Control+S`… |
| `select` | `selector`, `value` | `<select>` nativo |
| `drag` | `from`, `to` **ou** `dx`/`dy`, `steps?` | Arrasto com mouse real (dnd, sliders) |
| `scroll` | `selector` **ou** `dx`/`dy` | Rolagem |
| `wait` | `ms` (máx. 5000) | Só para animações; prefira `waitFor` |
| `waitFor` | `selector`, `state?` | `visible`/`hidden`/`attached` |
| `expect` | `selector` + `text?` `notText?` `visible?` `count?` `css?` `attr?` `js?` | Asserção; falha = evidência automática |
| `snapshot` | `selector?`, `maxChars?` | Árvore de acessibilidade em texto (barato) |
| `screenshot` | `name?`, `selector?` | Print (máx. 4 por execução) |
| `eval` | `js` | Lê estado arbitrário da página |
| `reload` | — | Recarrega o WebView |

Todo passo aceita `label` (aparece no relatório) e `timeout` (padrão 5000 ms).

**Seletores:** use os do Playwright, priorizando papel/nome acessível (`role=button[name='Salvar']`, `text=Principal`, `nav >> ...`). Evite classes Tailwind.

**Na falha** o probe para (salvo `--continue`) e anexa `snapshotOnFail` + print do momento do erro.

Saídas (prints, `app.log`, `app.pid`) ficam em `out/` (ignorado pelo git). Cenários com prefixo `_` são de autoteste do harness.

