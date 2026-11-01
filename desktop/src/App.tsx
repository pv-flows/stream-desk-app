import { FormEvent, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import QRCode from "react-qr-code";
import "./App.css";

interface DeckButton {
  id: number;
  label: string;
  action_name: string;
  color: string;
}

function App() {
  const [buttons, setButtons] = useState<DeckButton[]>([]);
  const [activeTheme, setActiveTheme] = useState<string>("default");
  const [localIp, setLocalIp] = useState<string>("127.0.0.1");
  const [label, setLabel] = useState("");
  const [actionName, setActionName] = useState("vol_up");
  const [color, setColor] = useState("#38bdf8");
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

  const handleAddButton = async (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !actionName.trim()) {
      setStatusMsg("Preencha o Label e a Action do botão.");
      return;
    }

    try {
      await invoke("add_button", {
        label: label.trim(),
        actionName: actionName.trim(),
        color: color.trim() || "#38bdf8",
      });
      setLabel("");
      setStatusMsg(`Botão "${label.trim()}" adicionado com sucesso!`);
      await loadButtons();
    } catch (error) {
      console.error("Erro ao adicionar botão:", error);
      setStatusMsg("Erro ao salvar botão no banco de dados.");
    }
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
        <h2>Novo Botão</h2>
        <form className="crud-form" onSubmit={handleAddButton}>
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
            <label htmlFor="action-input">Action (Macro)</label>
            <input
              id="action-input"
              type="text"
              list="macro-suggestions"
              placeholder="Ex: vol_up, vol_down, play_pause, open_calc"
              value={actionName}
              onChange={(e) => setActionName(e.currentTarget.value)}
            />
            <datalist id="macro-suggestions">
              <option value="vol_up">Volume + (vol_up)</option>
              <option value="vol_down">Volume - (vol_down)</option>
              <option value="play_pause">Play/Pause (play_pause)</option>
              <option value="open_calc">Calculadora (open_calc)</option>
            </datalist>
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

          <button type="submit" className="btn-primary">
            + Adicionar Botão
          </button>
        </form>
        {statusMsg && <p className="status-msg">{statusMsg}</p>}
      </section>

      <section className="card">
        <div className="section-header">
          <h2>Grade Atual ({buttons.length} botões)</h2>
          <button type="button" className="btn-secondary" onClick={loadButtons}>
            Atualizar Lista
          </button>
        </div>

        {buttons.length === 0 ? (
          <p className="empty-state">Nenhum botão cadastrado. Adicione acima!</p>
        ) : (
          <div className="deck-grid">
            {buttons.map((btn) => (
              <div
                key={btn.id}
                className="deck-item"
                style={{ borderColor: btn.color || "#38bdf8" }}
              >
                <button
                  type="button"
                  className="delete-btn"
                  title="Excluir botão"
                  onClick={() => handleDeleteButton(btn.id, btn.label)}
                >
                  ✕
                </button>
                <span
                  className="color-dot"
                  style={{ backgroundColor: btn.color || "#38bdf8" }}
                />
                <strong className="deck-label">{btn.label}</strong>
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
