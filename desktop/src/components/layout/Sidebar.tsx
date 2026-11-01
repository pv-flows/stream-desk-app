import React, { useState } from "react";
import {
  Grid,
  Layers,
  Sparkles,
  Palette,
  QrCode,
  Settings,
  Plus,
  Monitor,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDashboardStore } from "@/store/useDashboardStore";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "buttons", label: "Grade de Botões", icon: Grid },
  { id: "auto-profile", label: "Auto-Profile", icon: Monitor },
  { id: "themes", label: "Skins & Temas", icon: Palette },
  { id: "pairing", label: "Pareamento QR", icon: QrCode },
];

export interface SidebarProps {
  activeTab?: string;
  onSelectTab?: (tabId: string) => void;
}

export function Sidebar({
  activeTab: controlledTab,
  onSelectTab,
}: SidebarProps = {}) {
  const [internalTab, setInternalTab] = useState("buttons");
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
      {/* Brand Header */}
      <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight leading-none text-neutral-100">
              Stream Desk
            </h1>
            <span className="text-[10px] text-neutral-400 font-mono tracking-wider">
              HOST STUDIO
            </span>
          </div>
        </div>
        <Badge
          variant="outline"
          className="px-1.5 py-0.5 text-[9px] font-mono font-medium rounded-full bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
        >
          v0.2.0
        </Badge>
      </div>

      {/* Server Status Pill */}
      <div className="px-3 pt-3">
        <div className="px-3 py-2 rounded-lg bg-neutral-950/60 border border-neutral-800/70 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-medium text-neutral-200 truncate">
              Smart Server Ativo
            </span>
            <span className="text-[9px] font-mono text-neutral-400 truncate">
              {localIp || "0.0.0.0"}:8080/ws
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div>
          <span className="px-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
            Menu
          </span>
          <nav className="mt-1 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm"
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
          <div className="mt-1 space-y-0.5">
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
      </div>

      {/* Sidebar Footer com IP Real */}
      <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/40 flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Wifi className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-mono">LAN {localIp || "127.0.0.1"}</span>
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
