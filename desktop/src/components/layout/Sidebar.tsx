import React, { useState } from "react";
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
} from "lucide-react";
import { Page, useDashboardStore } from "@/store/useDashboardStore";
import { useToast } from "@/hooks/use-toast";

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
      // Caso o ambiente bloqueie window.prompt, abre o input inline
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

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col border-r border-neutral-800/80 bg-neutral-900/95 backdrop-blur-md select-none">
      {/* Top Window Bar com macOS Traffic Lights */}
      <div className="p-4 flex items-center justify-between border-b border-neutral-800/60">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              toast({
                title: "Controle de Janela",
                description: "Fechar aplicativo (atalho Alt+F4)",
              })
            }
            title="Fechar"
            className="w-3 h-3 rounded-full bg-red-500/90 inline-block shadow-sm hover:opacity-80 transition-opacity"
          />
          <button
            type="button"
            onClick={() =>
              toast({
                title: "Controle de Janela",
                description: "Minimizar para a barra de tarefas",
              })
            }
            title="Minimizar"
            className="w-3 h-3 rounded-full bg-amber-500/90 inline-block shadow-sm hover:opacity-80 transition-opacity"
          />
          <button
            type="button"
            onClick={() =>
              toast({
                title: "Controle de Janela",
                description: "Maximizar / Restaurar tamanho",
              })
            }
            title="Maximizar"
            className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block shadow-sm hover:opacity-80 transition-opacity"
          />
        </div>
        <span className="text-[10px] font-mono text-neutral-500">240px</span>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Seção Páginas (CRUD Completo via IPC) */}
        <div className="pt-3 border-t border-neutral-800/60">
          <div className="px-2 flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
              Páginas ({pages.length})
            </span>
            <button
              type="button"
              onClick={handleTriggerAddPage}
              title="Adicionar nova página"
              className="text-neutral-400 hover:text-indigo-400 p-1 rounded hover:bg-neutral-800 transition-colors"
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
                className="flex-1 min-w-0 h-7 px-2 rounded bg-neutral-950 border border-indigo-500/60 text-xs text-neutral-100 focus:outline-none"
              />
              <button
                type="submit"
                className="p-1 text-emerald-400 hover:bg-neutral-800 rounded"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsAddingPage(false)}
                className="p-1 text-neutral-400 hover:bg-neutral-800 rounded"
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
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-800"
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
                      className="flex-1 min-w-0 h-6 px-1.5 rounded bg-neutral-950 border border-indigo-500/50 text-xs text-neutral-100 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleConfirmInlineRename(page.id)}
                      className="p-0.5 text-emerald-400 hover:text-emerald-300"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPageId(null)}
                      className="p-0.5 text-neutral-400 hover:text-neutral-200"
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
                  className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isActive
                      ? "bg-neutral-800 text-neutral-100 font-medium border border-neutral-700/60"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <Layers className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                    <span className="truncate">{page.name}</span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleStartRename(page, e)}
                      title="Renomear página"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-indigo-300 transition-opacity"
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

                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950/50 text-neutral-400">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar Footer com IP Real */}
      <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/40 flex items-center justify-between text-xs text-neutral-400">
        <button
          type="button"
          onClick={() => {
            const ip = localIp || "192.168.1.15";
            navigator.clipboard?.writeText(ip);
            toast({
              title: "IP Local Copiado",
              description: `${ip} copiado para a área de transferência.`,
            });
          }}
          title="Clique para copiar o IP"
          className="flex items-center gap-1.5 text-[11px] hover:text-indigo-300 transition-colors cursor-pointer"
        >
          <Wifi className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-mono">LAN {localIp || "192.168.1.15"}</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectTab("system")}
          title="Configurações do Sistema"
          className="text-neutral-400 hover:text-neutral-200 p-1 rounded hover:bg-neutral-800 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
