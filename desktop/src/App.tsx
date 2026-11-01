import { useState } from "react";
import {
  Grid,
  Layers,
  Sparkles,
  Palette,
  QrCode,
  Settings,
  Plus,
  Monitor,
  Smartphone,
  RotateCw,
  Search,
  Wifi,
  ExternalLink,
  Zap,
  Volume2,
  Play,
  Terminal,
  FolderOpen,
} from "lucide-react";
import "./App.css";

export function App() {
  const [activeTab, setActiveTab] = useState<"buttons" | "auto-profile" | "themes" | "pairing">("buttons");
  const [activePage, setActivePage] = useState("Principal");
  const [previewOrientation, setPreviewOrientation] = useState<"portrait" | "landscape">("portrait");

  const navItems = [
    { id: "buttons", label: "Grade de Botões", icon: Grid },
    { id: "auto-profile", label: "Auto-Profile", icon: Monitor },
    { id: "themes", label: "Skins & Temas", icon: Palette },
    { id: "pairing", label: "Pareamento QR", icon: QrCode },
  ] as const;

  const mockPages = ["Principal", "Mídia & Áudio", "Dev & Terminal", "Produtividade"];

  const mockButtons = [
    { id: 1, label: "Calculadora", icon: Zap, action: "open_app:calc", color: "from-amber-500/20 to-amber-600/30", border: "border-amber-500/40" },
    { id: 2, label: "Navegador", icon: ExternalLink, action: "open_url:https://google.com", color: "from-sky-500/20 to-sky-600/30", border: "border-sky-500/40" },
    { id: 3, label: "Terminal", icon: Terminal, action: "open_app:cmd", color: "from-slate-500/20 to-slate-600/30", border: "border-slate-500/40" },
    { id: 4, label: "Gerenciador", icon: FolderOpen, action: "open_app:explorer", color: "from-emerald-500/20 to-emerald-600/30", border: "border-emerald-500/40" },
    { id: 5, label: "Volume +", icon: Volume2, action: "vol_up", color: "from-blue-500/20 to-blue-600/30", border: "border-blue-500/40" },
    { id: 6, label: "Play/Pause", icon: Play, action: "play_pause", color: "from-purple-500/20 to-purple-600/30", border: "border-purple-500/40" },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 select-none">
      {/* 1. SIDEBAR ESQUERDA (240px) */}
      <aside className="w-[240px] flex-shrink-0 flex flex-col border-r border-neutral-800/80 bg-neutral-900/95 backdrop-blur-md">
        {/* Brand Header */}
        <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight leading-none text-neutral-100">Stream Desk</h1>
              <span className="text-[10px] text-neutral-400 font-mono tracking-wider">HOST STUDIO</span>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            v0.2.0
          </span>
        </div>

        {/* Server Status Pill */}
        <div className="px-3 pt-3">
          <div className="px-3 py-2 rounded-lg bg-neutral-950/60 border border-neutral-800/70 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-medium text-neutral-200 truncate">Smart Server Ativo</span>
              <span className="text-[9px] font-mono text-neutral-400 truncate">0.0.0.0:8080/ws</span>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          <div>
            <span className="px-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Menu</span>
            <nav className="mt-1 space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-sm"
                        : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 border border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            <div className="px-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Páginas</span>
              <button
                title="Adicionar página"
                className="text-neutral-400 hover:text-sky-400 p-0.5 rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-1 space-y-0.5">
              {mockPages.map((page, idx) => (
                <button
                  key={page}
                  onClick={() => setActivePage(page)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    activePage === page
                      ? "bg-neutral-800 text-neutral-100 font-medium"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Layers className="w-3 h-3 text-neutral-400" />
                    <span className="truncate">{page}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-950/40 text-neutral-400">
                    {idx === 0 ? 6 : idx === 1 ? 4 : 2}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/40 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Wifi className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono">LAN 192.168.1.97</span>
          </div>
          <button className="text-neutral-400 hover:text-neutral-200 p-1 rounded hover:bg-neutral-800">
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* 2. ÁREA CENTRAL FLUIDA (flex-1) */}
      <main className="flex-1 flex flex-col min-w-0 bg-neutral-950/60 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-neutral-800/80 px-6 flex items-center justify-between bg-neutral-900/40 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-neutral-100 tracking-tight">{activePage}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
              6 slots preenchidos
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar atalho ou app..."
                className="w-48 pl-8 pr-3 py-1.5 text-xs rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:border-sky-500/50 transition-colors"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-500 hover:bg-sky-400 text-white shadow-sm shadow-sky-500/20 transition-all">
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Botão</span>
            </button>
          </div>
        </header>

        {/* Content View Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Notice Banner */}
          <div className="p-4 rounded-xl border border-sky-500/20 bg-gradient-to-r from-sky-950/30 to-indigo-950/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-sky-300">Modo de Design Profissional Ativo (Fase 2)</h3>
                <p className="text-[11px] text-neutral-400">
                  Esqueleto de layout de 3 colunas configurado com Tailwind CSS e Radix/Lucide.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Ready for Integration
            </span>
          </div>

          {/* Interactive Button Grid Simulator */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Grade de Botões</span>
              <span className="text-[11px] text-neutral-400">Arraste para reordenar</span>
            </div>

            <div className="grid grid-cols-3 gap-3.5">
              {mockButtons.map((btn) => {
                const Icon = btn.icon;
                return (
                  <div
                    key={btn.id}
                    className={`group relative p-4 rounded-xl border ${btn.border} bg-gradient-to-b ${btn.color} hover:border-sky-400/60 hover:shadow-lg hover:shadow-sky-500/10 transition-all cursor-grab active:cursor-grabbing flex flex-col justify-between min-h-[110px]`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="h-8 w-8 rounded-lg bg-neutral-900/80 border border-neutral-700/60 flex items-center justify-center text-neutral-200 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4 text-sky-400" />
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400">#{btn.id}</span>
                    </div>

                    <div className="mt-3">
                      <h4 className="text-xs font-semibold text-neutral-100 tracking-tight">{btn.label}</h4>
                      <code className="text-[10px] text-neutral-400 font-mono truncate block mt-0.5">
                        {btn.action}
                      </code>
                    </div>
                  </div>
                );
              })}

              {/* Add Button Slot */}
              <button className="border-2 border-dashed border-neutral-800 hover:border-neutral-700 rounded-xl flex flex-col items-center justify-center gap-1.5 p-4 text-neutral-400 hover:text-neutral-300 transition-colors min-h-[110px]">
                <Plus className="w-5 h-5" />
                <span className="text-xs font-medium">Slot Vazio</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 3. PAINEL DIREITO (320px - Mobile Live Preview) */}
      <aside className="w-[320px] flex-shrink-0 flex flex-col border-l border-neutral-800/80 bg-neutral-900/95 backdrop-blur-md">
        {/* Preview Header */}
        <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-semibold text-neutral-200">Mobile Live Preview</h3>
          </div>
          <button
            onClick={() => setPreviewOrientation((prev) => (prev === "portrait" ? "landscape" : "portrait"))}
            title="Girar Orientação da Maquete"
            className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mockup Display Wrapper */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
          {/* Smartphone Bezel */}
          <div
            className={`transition-all duration-300 relative border-4 border-neutral-700 rounded-[2rem] bg-neutral-950 shadow-2xl p-2.5 flex flex-col justify-between ${
              previewOrientation === "portrait" ? "w-[240px] h-[440px]" : "w-[290px] h-[190px]"
            }`}
          >
            {/* Dynamic Island / Notch */}
            <div className="self-center w-14 h-3 bg-neutral-800 rounded-full mb-1 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 inline-block" />
            </div>

            {/* Simulated Phone Screen Content */}
            <div className="flex-1 rounded-[1.25rem] bg-gradient-to-br from-slate-900 via-neutral-900 to-sky-950/40 p-2 border border-neutral-800/60 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between px-1 text-[9px] text-neutral-400 font-mono">
                <span>{activePage}</span>
                <span className="text-emerald-400">● 60 FPS</span>
              </div>

              {/* Scaled Mini Grid */}
              <div className="grid grid-cols-3 gap-1.5 my-auto">
                {mockButtons.map((btn) => (
                  <div
                    key={btn.id}
                    className="h-10 rounded-lg bg-neutral-800/90 border border-neutral-700/80 flex flex-col items-center justify-center text-center p-0.5"
                  >
                    <span className="text-[8px] font-medium text-neutral-200 leading-tight truncate w-full px-0.5">
                      {btn.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Dots Pager Indicator */}
              <div className="flex items-center justify-center gap-1 py-0.5">
                <span className="h-1 w-3 rounded-full bg-sky-400" />
                <span className="h-1 w-1 rounded-full bg-neutral-600" />
                <span className="h-1 w-1 rounded-full bg-neutral-600" />
              </div>
            </div>

            {/* Home Indicator Bar */}
            <div className="self-center w-16 h-1 bg-neutral-700 rounded-full mt-1" />
          </div>

          <p className="mt-3 text-[10px] text-neutral-400 text-center font-mono">
            Simulação em escala real do cliente Expo
          </p>
        </div>

        {/* Preview Footer Specs */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/40 text-[11px] text-neutral-400 space-y-1">
          <div className="flex justify-between">
            <span>Skin Ativa:</span>
            <span className="text-neutral-200 font-medium">Default (Glass)</span>
          </div>
          <div className="flex justify-between">
            <span>Orientação:</span>
            <span className="text-neutral-200 capitalize font-mono text-[10px]">{previewOrientation}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;
