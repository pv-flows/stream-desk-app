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
} from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";

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
  const [internalTab, setInternalTab] = useState("connection");
  const activeTab = controlledTab ?? internalTab;

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

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col border-r border-neutral-800/80 bg-neutral-900/95 backdrop-blur-md select-none">
      {/* Top Window Bar com macOS Traffic Lights (conforme Mockup) */}
      <div className="p-4 flex items-center justify-between border-b border-neutral-800/60">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/90 inline-block shadow-sm" />
          <span className="w-3 h-3 rounded-full bg-amber-500/90 inline-block shadow-sm" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block shadow-sm" />
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

        {/* Seção Páginas (visível em modo botões) */}
        {activeTab === "buttons" && (
          <div className="pt-2 border-t border-neutral-800/60">
            <div className="px-2 flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                Páginas
              </span>
              <button
                title="Adicionar página"
                className="text-neutral-400 hover:text-sky-400 p-0.5 rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {pages.map((page) => {
                const count = buttons.filter((b) => b.page_index === page.id).length;
                const isActive = activePageIndex === page.id;
                return (
                  <button
                    key={page.id}
                    onClick={() => setActivePageIndex(page.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      isActive
                        ? "bg-neutral-800 text-neutral-100 font-medium border border-neutral-700/60"
                        : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Layers className="w-3 h-3 text-neutral-400" />
                      <span className="truncate">{page.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950/40 text-neutral-400">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer com IP Real */}
      <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/40 flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Wifi className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-mono">LAN {localIp || "192.168.1.15"}</span>
        </div>
        <button
          title="Configurações do Servidor"
          className="text-neutral-400 hover:text-neutral-200 p-1 rounded hover:bg-neutral-800 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
