import React, { useState, useEffect } from "react";
import {
  Radio,
  LayoutGrid,
  Laptop,
  Palette,
  Network,
  Monitor,
  Info,
  Layers,
  Plus,
  Wifi,
  Settings,
  Pencil,
  Trash2,
  Check,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Page, useDashboardStore } from "@/store/useDashboardStore";
import { useToast } from "@/hooks/use-toast";
import { getAccentColor } from "@/lib/buttonUtils";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "connection", label: "Conexão", icon: Radio },
  { id: "buttons", label: "Páginas e botões", icon: LayoutGrid },
  { id: "auto-profile", label: "Perfis automáticos", icon: Laptop },
  { id: "themes", label: "Aparência", icon: Palette },
  { id: "integrations", label: "Integrações", icon: Network },
  { id: "system", label: "Sistema", icon: Monitor },
  { id: "about", label: "Sobre", icon: Info },
];

export interface SidebarProps {
  activeTab?: string;
  onSelectTab?: (tabId: string) => void;
}

export function Sidebar({
  activeTab: controlledTab,
  onSelectTab,
}: SidebarProps = {}) {
  const { toast } = useToast();
  const [internalTab, setInternalTab] = useState("connection");
  const activeTab = controlledTab ?? internalTab;

  const theme = useDashboardStore((s) => s.theme);
  const appearance = useDashboardStore((s) => s.appearance);

  const normalizedTheme = (appearance?.theme || theme || "escuro").toLowerCase();
  const isLight = normalizedTheme === "claro" || normalizedTheme === "light";
  const isAmoled = normalizedTheme === "amoled";

  const accent = getAccentColor(appearance);

  // Detecção de proporção quadrada ou 4:3 (aspect ratio <= 1.35 ou largura <= 1040px)
  const [isAutoCompact, setIsAutoCompact] = useState(false);
  const [manualOverride, setManualOverride] = useState<boolean | null>(null);

  useEffect(() => {
    const checkViewportRatio = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = width / (height || 1);
      // Ao achatar a tela para formato quadrado ou 4:3, recolhe liberando espaço
      const isSquareOr4x3 = ratio <= 1.35 || width <= 1040;
      setIsAutoCompact(isSquareOr4x3);
    };

    checkViewportRatio();
    window.addEventListener("resize", checkViewportRatio);
    return () => window.removeEventListener("resize", checkViewportRatio);
  }, []);

  const isCollapsed = manualOverride !== null ? manualOverride : isAutoCompact;

  const toggleCollapsed = () => {
    setHoveredTag(null);
    setManualOverride((prev) => (prev !== null ? !prev : !isAutoCompact));
  };

  // Estado da Tag Flutuante (Tooltip) ativo exclusivamente durante o recolhimento
  const [hoveredTag, setHoveredTag] = useState<{ label: string; top: number } | null>(null);

  const handleMouseEnter = (label: string, e: React.MouseEvent<HTMLElement>) => {
    if (!isCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTag({
      label,
      top: rect.top + rect.height / 2,
    });
  };

  const handleMouseLeave = () => {
    setHoveredTag(null);
  };

  // Estados locais para criação/renomeação rápida de páginas
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [editingPageName, setEditingPageName] = useState("");

  const handleSelectTab = (tabId: string) => {
    if (onSelectTab) {
      onSelectTab(tabId);
    } else {
      setInternalTab(tabId);
    }
  };

  const pages = useDashboardStore((s) => s.pages);
  const buttons = useDashboardStore((s) => s.buttons);
  const localIp = useDashboardStore((s) => s.localIp);
  const activePageIndex = useDashboardStore((s) => s.activePageIndex);
  const setActivePageIndex = useDashboardStore((s) => s.setActivePageIndex);
  const addPage = useDashboardStore((s) => s.addPage);
  const updatePage = useDashboardStore((s) => s.updatePage);
  const deletePage = useDashboardStore((s) => s.deletePage);

  const handleTriggerAddPage = async () => {
    const prompted = window.prompt("Nome da nova página:");
    if (prompted && prompted.trim()) {
      await addPage(prompted.trim());
      handleSelectTab("buttons");
    } else if (prompted === null) {
      setIsAddingPage(true);
      setNewPageName("");
    }
  };

  const handleConfirmInlineAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageName.trim()) return;
    await addPage(newPageName.trim());
    setNewPageName("");
    setIsAddingPage(false);
    handleSelectTab("buttons");
  };

  const handleStartRename = (page: Page, e: React.MouseEvent) => {
    e.stopPropagation();
    const prompted = window.prompt("Renomear página:", page.name);
    if (prompted && prompted.trim() && prompted.trim() !== page.name) {
      updatePage(page.id, prompted.trim());
    } else if (prompted === null) {
      setEditingPageId(page.id);
      setEditingPageName(page.name);
    }
  };

  const handleConfirmInlineRename = async (pageId: number) => {
    if (editingPageName.trim()) {
      await updatePage(pageId, editingPageName.trim());
    }
    setEditingPageId(null);
    setEditingPageName("");
  };

  const handleDeletePage = async (page: Page, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pages.length <= 1) return;
    await deletePage(page.id);
  };

  const sidebarBg = isLight
    ? "bg-white/95 border-slate-200 text-slate-800"
    : isAmoled
    ? "bg-black border-neutral-900 text-white"
    : "bg-neutral-900/95 border-neutral-800/80 text-white";

  const borderColor = isLight
    ? "border-slate-200"
    : isAmoled
    ? "border-neutral-900"
    : "border-neutral-800/80";

  return (
    <>
      <aside
        className={`${
          isCollapsed
            ? "w-[68px] min-w-[68px] max-w-[68px]"
            : "w-[240px] min-w-[240px] max-w-[240px]"
        } flex-shrink-0 flex flex-col border-r ${sidebarBg} backdrop-blur-md select-none transition-all duration-200 ease-in-out relative z-30 overflow-x-hidden no-scrollbar`}
      >
        {/* Header com Branding e Botão Harmônico para Ativar/Desarmar Accordion */}
        <div className={`h-14 flex-shrink-0 px-3 flex items-center justify-between border-b ${borderColor} overflow-hidden`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                <div
                  style={{
                    backgroundColor: `${accent.hex}18`,
                    borderColor: `${accent.hex}33`,
                    color: accent.hex,
                  }}
                  className="w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors"
                >
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-xs font-semibold ${isLight ? "text-slate-800" : "text-neutral-200"} tracking-tight leading-none truncate`}>
                    Stream Desk
                  </span>
                  <span className={`text-[10px] ${isLight ? "text-slate-500" : "text-neutral-500"} leading-none mt-1`}>
                    Studio
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleCollapsed}
                title="Recolher barra lateral"
                className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                  isLight
                    ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                type="button"
                onClick={toggleCollapsed}
                onMouseEnter={(e) => handleMouseEnter("Expandir menu lateral", e)}
                onMouseLeave={handleMouseLeave}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shadow-sm cursor-pointer ${
                  isLight
                    ? "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
                }`}
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden no-scrollbar ${isCollapsed ? "px-2" : "px-3"} py-3 space-y-4`}>
          <div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => handleSelectTab(item.id)}
                      onMouseEnter={(e) => handleMouseEnter(item.label, e)}
                      onMouseLeave={handleMouseLeave}
                      style={
                        isActive
                          ? {
                              backgroundColor: accent.hex,
                              color: "#ffffff",
                              boxShadow: `0 4px 14px ${accent.hex}40`,
                            }
                          : undefined
                      }
                      className={`w-full flex items-center ${
                        isCollapsed ? "justify-center px-2" : "gap-3 px-3"
                      } py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? "text-white font-semibold"
                          : isLight
                          ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Seção Páginas (CRUD Completo via IPC) */}
          <div className={`pt-3 border-t ${borderColor} ${isCollapsed ? "px-1" : ""}`}>
            {!isCollapsed ? (
              <>
                <div className="px-2 flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
                    Páginas ({pages.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleTriggerAddPage}
                    title="Adicionar nova página"
                    className={`p-1 rounded transition-colors ${
                      isLight
                        ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Input Inline para Nova Página (caso aberto) */}
                {isAddingPage && (
                  <form
                    onSubmit={handleConfirmInlineAdd}
                    className="mb-2 flex items-center gap-1 px-1"
                  >
                    <input
                      type="text"
                      value={newPageName}
                      onChange={(e) => setNewPageName(e.target.value)}
                      placeholder="Nome da página..."
                      autoFocus
                      className={`flex-1 min-w-0 h-7 px-2 rounded border text-xs focus:outline-none ${
                        isLight
                          ? "bg-white border-slate-300 text-slate-800"
                          : "bg-neutral-950 border-neutral-700 text-neutral-100"
                      }`}
                    />
                    <button
                      type="submit"
                      className="p-1 text-emerald-500 hover:bg-neutral-800 rounded"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingPage(false)}
                      className={`p-1 rounded ${isLight ? "text-slate-400 hover:bg-slate-100" : "text-neutral-400 hover:bg-neutral-800"}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}

                <div className="space-y-0.5">
                  {pages.map((page) => {
                    const count = buttons.filter((b) => b.page_index === page.id).length;
                    const isActive = activePageIndex === page.id;
                    const isEditing = editingPageId === page.id;

                    if (isEditing) {
                      return (
                        <div
                          key={page.id}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg ${isLight ? "bg-slate-100" : "bg-neutral-800"}`}
                        >
                          <input
                            type="text"
                            value={editingPageName}
                            onChange={(e) => setEditingPageName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleConfirmInlineRename(page.id);
                              if (e.key === "Escape") setEditingPageId(null);
                            }}
                            className={`flex-1 min-w-0 h-6 px-1.5 rounded border text-xs focus:outline-none ${
                              isLight
                                ? "bg-white border-slate-300 text-slate-800"
                                : "bg-neutral-950 border-neutral-700 text-neutral-100"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleConfirmInlineRename(page.id)}
                            className="p-0.5 text-emerald-500"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPageId(null)}
                            className={`p-0.5 ${isLight ? "text-slate-400" : "text-neutral-400"}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={page.id}
                        onClick={() => {
                          setActivePageIndex(page.id);
                          handleSelectTab("buttons");
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          handleStartRename(page, e);
                        }}
                        style={
                          isActive
                            ? {
                                borderColor: `${accent.hex}55`,
                                backgroundColor: `${accent.hex}15`,
                              }
                            : undefined
                        }
                        className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          isActive
                            ? `font-medium border ${isLight ? "text-slate-900" : "text-neutral-100"}`
                            : isLight
                            ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
                            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <Layers
                            style={{ color: accent.hex }}
                            className="w-3 h-3 flex-shrink-0"
                          />
                          <span className="truncate">{page.name}</span>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleStartRename(page, e)}
                            title="Renomear página"
                            className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${
                              isLight
                                ? "hover:bg-slate-200 text-slate-500"
                                : "hover:bg-neutral-700 text-neutral-400"
                            }`}
                          >
                            <Pencil className="w-2.5 h-2.5" />
                          </button>

                          {pages.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleDeletePage(page, e)}
                              title="Excluir página"
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-950/60 text-neutral-400 hover:text-red-400 transition-opacity"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}

                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isLight ? "bg-slate-200/60 text-slate-600" : "bg-neutral-950/50 text-neutral-400"}`}>
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1.5 py-1">
                {pages.map((page) => {
                  const isActive = activePageIndex === page.id;
                  return (
                    <div key={page.id} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setActivePageIndex(page.id);
                          handleSelectTab("buttons");
                        }}
                        onMouseEnter={(e) => handleMouseEnter(`Página: ${page.name}`, e)}
                        onMouseLeave={handleMouseLeave}
                        style={
                          isActive
                            ? {
                                backgroundColor: `${accent.hex}22`,
                                borderColor: `${accent.hex}66`,
                                color: accent.hex,
                              }
                            : undefined
                        }
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          isActive
                            ? "border shadow-sm"
                            : isLight
                            ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleTriggerAddPage}
                    onMouseEnter={(e) => handleMouseEnter("Nova Página", e)}
                    onMouseLeave={handleMouseLeave}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isLight
                        ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer com IP Real */}
        <div
          className={`p-3 border-t ${borderColor} ${
            isLight ? "bg-slate-50 text-slate-600" : isAmoled ? "bg-black text-neutral-400" : "bg-neutral-950/40 text-neutral-400"
          } flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          } text-xs overflow-hidden flex-shrink-0`}
        >
          {isCollapsed ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  const ip = localIp || "127.0.0.1";
                  navigator.clipboard?.writeText(ip);
                  toast({
                    title: "IP Local Copiado",
                    description: `${ip} copiado para a área de transferência.`,
                  });
                }}
                onMouseEnter={(e) => handleMouseEnter(`IP LAN: ${localIp || "127.0.0.1"} (copiar)`, e)}
                onMouseLeave={handleMouseLeave}
                style={{ color: accent.hex }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  isLight ? "hover:bg-slate-200" : "hover:bg-neutral-800"
                }`}
              >
                <Wifi className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  const ip = localIp || "127.0.0.1";
                  navigator.clipboard?.writeText(ip);
                  toast({
                    title: "IP Local Copiado",
                    description: `${ip} copiado para a área de transferência.`,
                  });
                }}
                title="Clique para copiar o IP"
                className={`flex items-center gap-1.5 text-[11px] transition-colors cursor-pointer min-w-0 ${
                  isLight ? "hover:text-slate-900" : "hover:text-neutral-200"
                }`}
              >
                <Wifi style={{ color: accent.hex }} className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-mono truncate">LAN {localIp || "127.0.0.1"}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectTab("system")}
                title="Configurações do Sistema"
                className={`p-1 rounded transition-colors flex-shrink-0 ${
                  isLight
                    ? "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Tags Flutuantes ativas APENAS quando a barra lateral está encolhida */}
      {isCollapsed && hoveredTag && (
        <div
          style={{ top: `${hoveredTag.top}px`, left: "76px" }}
          className="fixed -translate-y-1/2 z-[9999] pointer-events-none flex items-center animate-in fade-in-0 zoom-in-95 duration-100"
        >
          <div className="relative px-3 py-1.5 bg-neutral-900/95 border border-neutral-700/80 rounded-md shadow-2xl text-xs font-medium text-neutral-100 whitespace-nowrap backdrop-blur-md flex items-center gap-1.5">
            {/* Seta indicadora apontando diretamente para o botão */}
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-neutral-900 border-l border-b border-neutral-700/80 rotate-45" />
            <span className="relative z-10">{hoveredTag.label}</span>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
