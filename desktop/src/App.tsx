import { FormEvent, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import QRCode from "react-qr-code";
import "./App.css";

interface DeckButton {
  id: number;
  label: string;
  action_name: string;
  color: string;
  icon?: string;
  page_index?: number;
}

function App() {
  const [buttons, setButtons] = useState<DeckButton[]>([]);
  const [activeTheme, setActiveTheme] = useState<string>("default");
  const [localIp, setLocalIp] = useState<string>("127.0.0.1");
  const [activePage, setActivePage] = useState<number>(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [label, setLabel] = useState("");
  const [actionType, setActionType] = useState("vol_up");
  const [actionCustomParam, setActionCustomParam] = useState("");
  const [color, setColor] = useState("#38bdf8");
  const [icon, setIcon] = useState("zap");
  const [statusMsg, setStatusMsg] = useState<string>("");

  const loadButtons = async () => {
    try {
      const data = await invoke<DeckButton[]>("get_buttons");
      setButtons(data);
    } catch (error) {
      console.error("Erro ao carregar botões:", error);
      setStatusMsg("Erro ao carregar botões do SQLite.");
    }
  };

  const loadTheme = async () => {
    try {
      const theme = await invoke<string>("get_theme");
      if (theme) setActiveTheme(theme);
    } catch (error) {
      console.error("Erro ao carregar tema:", error);
    }
  };

  const loadLocalIp = async () => {
    try {
      const ip = await invoke<string>("get_local_ip");
      if (ip) setLocalIp(ip);
    } catch (error) {
      console.error("Erro ao obter IP local:", error);
    }
  };

  useEffect(() => {
    loadButtons();
    loadTheme();
    loadLocalIp();
  }, []);

  const handleThemeChange = async (theme: string) => {
    setActiveTheme(theme);
    try {
      await invoke("set_theme", { theme });
      setStatusMsg(`Tema global alterado para "${theme}"!`);
    } catch (error) {
      console.error("Erro ao alterar tema:", error);
      setStatusMsg("Erro ao salvar tema no banco de dados.");
    }
  };

  const computeFinalAction = (): string => {
    if (actionType === "open_url") {
      return `open_url:${actionCustomParam.trim()}`;
    }
    if (actionType === "open_app") {
      return `open_app:${actionCustomParam.trim()}`;
    }
    return actionType;
  };

  const parseActionForForm = (rawAction: string) => {
    if (rawAction.startsWith("open_url:")) {
      setActionType("open_url");
      setActionCustomParam(rawAction.replace("open_url:", ""));
    } else if (rawAction.startsWith("open_app:")) {
      setActionType("open_app");
      setActionCustomParam(rawAction.replace("open_app:", ""));
    } else {
      setActionType(rawAction);
      setActionCustomParam("");
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const finalAction = computeFinalAction();

    if (!label.trim() || !finalAction.trim()) {
      setStatusMsg("Preencha o Label e a Action do botão.");
      return;
    }

    if (
      (actionType === "open_url" || actionType === "open_app") &&
      !actionCustomParam.trim()
    ) {
      setStatusMsg("Informe a URL ou o Caminho do Aplicativo.");
      return;
    }

    try {
      if (editingId !== null) {
        await invoke("update_button", {
          id: editingId,
          label: label.trim(),
          actionName: finalAction,
          color: color.trim() || "#38bdf8",
          icon: icon.trim() || "zap",
          pageIndex: activePage,
        });
        setStatusMsg(`Botão "${label.trim()}" atualizado na Página ${activePage + 1}!`);
        setEditingId(null);
      } else {
        await invoke("add_button", {
          label: label.trim(),
          actionName: finalAction,
          color: color.trim() || "#38bdf8",
          icon: icon.trim() || "zap",
          pageIndex: activePage,
        });
        setStatusMsg(`Botão "${label.trim()}" adicionado à Página ${activePage + 1}!`);
      }

      setLabel("");
      setActionType("vol_up");
      setActionCustomParam("");
      setColor("#38bdf8");
      setIcon("zap");
      await loadButtons();
    } catch (error) {
      console.error("Erro ao salvar botão:", error);
      setStatusMsg("Erro ao salvar botão no banco de dados.");
    }
  };

  const handleEditClick = (btn: DeckButton) => {
    setEditingId(btn.id);
    setLabel(btn.label);
    parseActionForForm(btn.action_name);
    setColor(btn.color || "#38bdf8");
    setIcon(btn.icon || "zap");
    if (btn.page_index !== undefined) {
      setActivePage(btn.page_index);
    }
    setStatusMsg(`Editando botão "${btn.label}" (ID ${btn.id}).`);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setLabel("");
    setActionType("vol_up");
    setActionCustomParam("");
    setColor("#38bdf8");
    setIcon("zap");
    setStatusMsg("Edição cancelada.");
  };

  const handleDeleteButton = async (id: number, btnLabel: string) => {
    try {
      await invoke("delete_button", { id });
      setStatusMsg(`Botão "${btnLabel}" removido.`);
      await loadButtons();
    } catch (error) {
      console.error("Erro ao remover botão:", error);
      setStatusMsg("Erro ao remover botão.");
    }
  };

  return (
    <main className="container">
      <header className="header">
        <h1>Stream Desk - Gerenciador de Botões</h1>
        <p className="subtitle">
          Servidor WebSocket ativo na porta <code>8080/ws</code> | Banco SQLite (<code>streamdesk.db</code>)
        </p>

        <div className="connection-panel">
          <div className="qr-wrapper">
            <QRCode value={`ws://${localIp}:8080/ws`} size={128} />
          </div>
          <div className="connection-info">
            <span className="connection-badge">Pareamento via QR Code</span>
            <p className="connection-ip">
              IP Local (LAN): <strong>{localIp}</strong>
            </p>
            <code className="connection-ws">ws://{localIp}:8080/ws</code>
            <div className="theme-selector-bar">
              <label htmlFor="theme-select">Tema Global (Mobile Skin):</label>
              <select
                id="theme-select"
                value={activeTheme}
                onChange={(e) => handleThemeChange(e.currentTarget.value)}
              >
                <option value="default">Padrão</option>
                <option value="apple">Apple</option>
                <option value="windows">Windows</option>
                <option value="steam">Steam</option>
                <option value="oneui">One UI</option>
                <option value="chromebook">Chromebook</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <section className="card">
        <h2>{editingId !== null ? "Editar Botão" : "Novo Botão"}</h2>
        <form className="crud-form" onSubmit={handleFormSubmit}>
          <div className="field">
            <label htmlFor="label-input">Label (Nome no Botão)</label>
            <input
              id="label-input"
              type="text"
              placeholder="Ex: Mute, Calculadora..."
              value={label}
              onChange={(e) => setLabel(e.currentTarget.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="action-select">Action (Macro)</label>
            <select
              id="action-select"
              value={actionType}
              onChange={(e) => setActionType(e.currentTarget.value)}
            >
              <optgroup label="Controles de Áudio & Mídia">
                <option value="vol_up">Volume + (vol_up)</option>
                <option value="vol_down">Volume - (vol_down)</option>
                <option value="mute">Mudo / Mute (mute)</option>
                <option value="play_pause">Play/Pause (play_pause)</option>
                <option value="media_next">Próxima Faixa (media_next)</option>
                <option value="media_prev">Faixa Anterior (media_prev)</option>
              </optgroup>
              <optgroup label="Automações e Sistema">
                <option value="open_calc">Calculadora (open_calc)</option>
                <option value="open_url">Abrir Site (URL)</option>
                <option value="open_app">Abrir Aplicativo / Script</option>
              </optgroup>
            </select>
          </div>

          {(actionType === "open_url" || actionType === "open_app") && (
            <div className="field">
              <label htmlFor="custom-param-input">
                {actionType === "open_url"
                  ? "URL do Site (ex: https://youtube.com)"
                  : "Caminho / Executável (ex: notepad, code, spotify)"}
              </label>
              <input
                id="custom-param-input"
                type="text"
                placeholder={
                  actionType === "open_url"
                    ? "https://..."
                    : "notepad / calc / caminho do .exe"
                }
                value={actionCustomParam}
                onChange={(e) => setActionCustomParam(e.currentTarget.value)}
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="icon-select">Ícone</label>
            <select
              id="icon-select"
              value={icon}
              onChange={(e) => setIcon(e.currentTarget.value)}
            >
              <option value="volume-2">volume-2 (Volume +)</option>
              <option value="volume-x">volume-x (Volume -)</option>
              <option value="mic-off">mic-off (Mute Mic)</option>
              <option value="play">play (Play/Pause)</option>
              <option value="calculator">calculator (Calculadora)</option>
              <option value="globe">globe (Navegador)</option>
              <option value="settings">settings (Configurações)</option>
              <option value="folder">folder (Pastas)</option>
              <option value="terminal">terminal (Terminal)</option>
              <option value="zap">zap (Ação Rápida)</option>
            </select>
          </div>

          <div className="field field-color">
            <label htmlFor="color-input">Cor</label>
            <div className="color-Input-group">
              <input
                id="color-picker"
                type="color"
                value={color}
                onChange={(e) => setColor(e.currentTarget.value)}
              />
              <input
                id="color-input"
                type="text"
                value={color}
                onChange={(e) => setColor(e.currentTarget.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingId !== null ? "Salvar Alteração" : "+ Adicionar Botão"}
            </button>
            {editingId !== null && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelEdit}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
        {statusMsg && <p className="status-msg">{statusMsg}</p>}
      </section>

      <section className="card">
        <div className="section-header">
          <h2>
            Grade Atual - Página {activePage + 1} (
            {buttons.filter((b) => (b.page_index ?? 0) === activePage).length} botões)
          </h2>
          <button type="button" className="btn-secondary" onClick={loadButtons}>
            Atualizar Lista
          </button>
        </div>

        <div className="page-tabs-bar">
          {[0, 1, 2].map((pIndex) => {
            const countOnPage = buttons.filter((b) => (b.page_index ?? 0) === pIndex).length;
            const isActive = activePage === pIndex;
            return (
              <button
                key={pIndex}
                type="button"
                className={`page-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => {
                  setActivePage(pIndex);
                  setEditingId(null);
                }}
              >
                Página {pIndex + 1} ({countOnPage})
              </button>
            );
          })}
        </div>

        {buttons.filter((b) => (b.page_index ?? 0) === activePage).length === 0 ? (
          <p className="empty-state">
            Nenhum botão cadastrado na Página {activePage + 1}. Adicione acima!
          </p>
        ) : (
          <div className="deck-grid">
            {buttons
              .filter((b) => (b.page_index ?? 0) === activePage)
              .map((btn) => (
              <div
                key={btn.id}
                className="deck-item"
                style={{ borderColor: btn.color || "#38bdf8" }}
              >
                <div className="item-actions">
                  <button
                    type="button"
                    className="edit-btn"
                    title="Editar botão"
                    onClick={() => handleEditClick(btn)}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="delete-btn"
                    title="Excluir botão"
                    onClick={() => handleDeleteButton(btn.id, btn.label)}
                  >
                    ✕
                  </button>
                </div>
                <span
                  className="color-dot"
                  style={{ backgroundColor: btn.color || "#38bdf8" }}
                />
                <strong className="deck-label">{btn.label}</strong>
                <span className="deck-icon-badge">icon: {btn.icon || "zap"}</span>
                <code className="deck-action">{btn.action_name}</code>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
