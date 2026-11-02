import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  Sparkles,
  Plus,
  Search,
  Settings,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { DeckButton, useDashboardStore } from "@/store/useDashboardStore";
import {
  getLucideIcon,
  getButtonColorStyles,
  isBase64Icon,
  getBase64Src,
  getAccentColor,
  resolveAccentColorHex,
  getButtonRadiusClass,
  getLabelFontSizeClass,
} from "@/lib/buttonUtils";
import { ButtonEditorSheet } from "@/components/ButtonEditorSheet";
import { ConnectionView } from "@/components/views/ConnectionView";
import { AutoProfileView } from "@/components/views/AutoProfileView";
import { AppearanceView } from "@/components/views/AppearanceView";
import { IntegrationsView } from "@/components/views/IntegrationsView";
import { SystemView } from "@/components/views/SystemView";
import { AboutView } from "@/components/views/AboutView";

export interface CentralAreaProps {
  activeTab?: string;
  activePage?: string;
}

export function CentralArea({
  activeTab = "connection",
  activePage: controlledPage,
}: CentralAreaProps) {
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedButton, setSelectedButton] = useState<DeckButton | null>(null);

  const buttons = useDashboardStore((s) => s.buttons);
  const setButtons = useDashboardStore((s) => s.setButtons);
  const fetchButtons = useDashboardStore((s) => s.fetchButtons);
  const pages = useDashboardStore((s) => s.pages);
  const activePageIndex = useDashboardStore((s) => s.activePageIndex);
  const theme = useDashboardStore((s) => s.theme);
  const appearance = useDashboardStore((s) => s.appearance);

  // Roteamento de visualizações secundárias
  if (activeTab === "connection") {
    return <ConnectionView />;
  }

  if (activeTab === "auto-profile") {
    return <AutoProfileView />;
  }

  if (activeTab === "themes") {
    return <AppearanceView />;
  }

  if (activeTab === "integrations") {
    return <IntegrationsView />;
  }

  if (activeTab === "system") {
    return <SystemView />;
  }

  if (activeTab === "about") {
    return <AboutView />;
  }

  const activePageObject = pages.find((p) => p.id === activePageIndex);
  const currentPageTitle =
    controlledPage ?? (activePageObject ? activePageObject.name : "Página Principal");

  const normalizedTheme = (appearance?.theme || theme || "escuro").toLowerCase();
  const isLight = normalizedTheme === "claro" || normalizedTheme === "light";
  const isAmoled = normalizedTheme === "amoled";

  // Filtra e ordena os botões pertencentes à página ativa
  const pageButtons = buttons
    .filter((btn) => btn.page_index === activePageIndex)
    .sort((a, b) => a.position - b.position);

  // Aplica busca por texto e filtro de categoria
  const filteredButtons = pageButtons.filter((btn) => {
    const matchesSearch =
      btn.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      btn.action_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterCategory === "apps") {
      return (
        btn.action_name.startsWith("open_app") ||
        btn.action_name.startsWith("app")
      );
    }
    if (filterCategory === "media") {
      return (
        btn.action_name.startsWith("vol") ||
        btn.action_name.includes("play") ||
        btn.action_name.includes("media")
      );
    }
    if (filterCategory === "macros") {
      return (
        btn.action_name.startsWith("macro") ||
        btn.action_name.startsWith("key") ||
        btn.action_name.startsWith("hotkey")
      );
    }

    return true;
  });

  // Handler de Drag-and-Drop com atualização otimista no Zustand + persistência IPC
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    // Reordena a lista atual da página ativa
    const reorderedPageButtons = Array.from(filteredButtons);
    const [movedButton] = reorderedPageButtons.splice(sourceIndex, 1);
    reorderedPageButtons.splice(destIndex, 0, movedButton);

    // Atribui as novas posições sequenciais
    const updatedPageButtons = reorderedPageButtons.map((btn, idx) => ({
      ...btn,
      position: idx,
    }));

    // Atualiza otimisticamente o estado global no Zustand
    const updatedIds = new Set(updatedPageButtons.map((b) => b.id));
    const otherButtons = buttons.filter((b) => !updatedIds.has(b.id));
    setButtons([...otherButtons, ...updatedPageButtons]);

    // Prepara payload e invoca IPC no Tauri
    const updates = updatedPageButtons.map((btn) => ({
      id: btn.id,
      position: btn.position,
      page_index: btn.page_index,
    }));

    try {
      await invoke("update_button_positions", { updates });
    } catch (err) {
      console.error("[DND] Erro ao persistir posições via IPC:", err);
      await fetchButtons();
    }
  };

  const handleOpenCreate = () => {
    setSelectedButton(null);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (btn: DeckButton) => {
    setSelectedButton(btn);
    setIsSheetOpen(true);
  };

  const accent = getAccentColor(appearance);
  const iconStyle = appearance?.icon_style === "preenchido" ? "preenchido" : "linha";
  const isFilled = iconStyle === "preenchido";
  const buttonRadiusClass = getButtonRadiusClass(appearance?.button_radius);
  const showLabels = appearance?.show_labels ?? true;
  const labelFontSizeClass = getLabelFontSizeClass(appearance?.label_font_size);
  const glowEnabled = appearance?.glow_enabled ?? false;

  // Dimensão dinâmica dos botões de 1 a 10 (padrão = 5, sincronizado com o celular)
  const buttonDimension = Math.max(1, Math.min(10, appearance?.grid_columns || 5));
  const minColWidth = Math.round(110 + (buttonDimension - 1) * 11);
  const minCardHeight = Math.round(90 + (buttonDimension - 1) * 8);
  const iconSizeClass = buttonDimension >= 7 ? "w-6 h-6" : buttonDimension <= 3 ? "w-4 h-4" : "w-5 h-5";

  return (
    <main
      style={appearance?.custom_bg_hex ? { backgroundColor: appearance.custom_bg_hex } : undefined}
      className={`flex-1 flex flex-col min-w-0 ${
        appearance?.custom_bg_hex
          ? ""
          : isLight
          ? "bg-slate-50/90 text-slate-900"
          : isAmoled
          ? "bg-black text-white"
          : "bg-neutral-950/60 text-white"
      } overflow-hidden select-none transition-colors duration-200`}
    >
      {/* Top Header Dinâmico */}
      <header
        className={`h-14 flex-shrink-0 border-b ${
          isLight
            ? "bg-white/80 border-slate-200 text-slate-800"
            : isAmoled
            ? "bg-black/80 border-neutral-900 text-white"
            : "bg-neutral-900/40 border-neutral-800/80 text-white"
        } px-4 sm:px-6 flex items-center justify-between gap-3 backdrop-blur-sm`}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <h2 className="text-sm font-semibold tracking-tight truncate">
            {currentPageTitle}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className={`w-32 sm:w-44 md:w-52 h-8 pl-8 pr-3 text-xs border focus-visible:ring-1 transition-all ${
                isLight
                  ? "bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus-visible:ring-slate-400"
                  : "bg-neutral-900/80 border-neutral-800 text-neutral-200 placeholder:text-neutral-500 focus-visible:ring-indigo-500/50"
              }`}
            />
          </div>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            style={{
              backgroundColor: accent.hex,
              color: "#ffffff",
              boxShadow: `0 4px 14px ${accent.hex}35`,
            }}
            className="h-8 gap-1.5 px-3 text-xs font-medium hover:opacity-90 shadow-sm flex-shrink-0 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Novo Botão</span>
            <span className="sm:hidden">+ Novo</span>
          </Button>
        </div>
      </header>

      {/* Content View Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-5">
        {/* Quick Notice Banner */}
        <div
          style={{
            borderColor: `${accent.hex}33`,
            background: isLight
              ? `linear-gradient(to right, ${accent.hex}12, transparent)`
              : `linear-gradient(to right, ${accent.hex}22, transparent)`,
          }}
          className="p-3.5 sm:p-4 rounded-xl border flex items-center justify-between gap-3 shadow-sm transition-all"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              style={{
                backgroundColor: `${accent.hex}18`,
                borderColor: `${accent.hex}33`,
                color: accent.hex,
              }}
              className="h-9 w-9 rounded-lg border flex items-center justify-center flex-shrink-0"
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                style={{ color: accent.hex }}
                className="text-xs sm:text-sm font-semibold whitespace-normal break-words"
              >
                Grade de Botões com Drag-and-Drop Reativo
              </h3>
              <p className={`text-[11px] ${isLight ? "text-slate-600" : "text-neutral-400"} mt-0.5 line-clamp-2 sm:line-clamp-none`}>
                Arraste os cards para reordenar instantaneamente ou dê duplo clique para editar.
              </p>
            </div>
          </div>
        </div>

        {/* Abas e Filtros de Categoria */}
        <div
          className={`flex items-center justify-between border-b ${
            isLight ? "border-slate-200" : "border-neutral-800/60"
          } pb-3 gap-2 overflow-x-auto no-scrollbar`}
        >
          <Tabs
            value={filterCategory}
            onValueChange={setFilterCategory}
            className="w-auto flex-shrink-0"
          >
            <TabsList
              className={`h-8 p-0.5 border ${
                isLight ? "bg-slate-100 border-slate-200" : "bg-neutral-900/80 border-neutral-800"
              }`}
            >
              <TabsTrigger
                value="all"
                style={filterCategory === "all" ? { backgroundColor: accent.hex, color: "#ffffff" } : undefined}
                className="text-xs px-2.5 sm:px-3 py-1 transition-all"
              >
                Todos ({pageButtons.length})
              </TabsTrigger>
              <TabsTrigger
                value="apps"
                style={filterCategory === "apps" ? { backgroundColor: accent.hex, color: "#ffffff" } : undefined}
                className="text-xs px-2.5 sm:px-3 py-1 transition-all"
              >
                Aplicativos
              </TabsTrigger>
              <TabsTrigger
                value="media"
                style={filterCategory === "media" ? { backgroundColor: accent.hex, color: "#ffffff" } : undefined}
                className="text-xs px-2.5 sm:px-3 py-1 transition-all"
              >
                Mídia & Som
              </TabsTrigger>
              <TabsTrigger
                value="macros"
                style={filterCategory === "macros" ? { backgroundColor: accent.hex, color: "#ffffff" } : undefined}
                className="text-xs px-2.5 sm:px-3 py-1 transition-all"
              >
                Macros
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Grade de Botões com @hello-pangea/dnd e Tamanho Dinâmico (1 a 10) */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={`grid-page-${activePageIndex}`}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  gridTemplateColumns: `repeat(auto-fill, minmax(${minColWidth}px, 1fr))`,
                }}
                className="grid gap-3.5"
              >
                {filteredButtons.map((btn, index) => {
                  const Icon = getLucideIcon(btn.icon);
                  const colorStyle = getButtonColorStyles(btn.color);
                  const hasBase64 = isBase64Icon(btn.icon);
                  const btnAccentColor = resolveAccentColorHex(btn.color, accent.hex);

                  return (
                    <Draggable
                      key={btn.id}
                      draggableId={String(btn.id)}
                      index={index}
                    >
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          onDoubleClick={() => handleOpenEdit(btn)}
                        >
                          <Card
                            style={{
                              ...colorStyle.style,
                              minHeight: `${minCardHeight}px`,
                              borderColor: `${btnAccentColor}44`,
                              boxShadow: glowEnabled ? `0 0 16px -2px ${btnAccentColor}35` : undefined,
                            }}
                            className={`group relative p-4 ${buttonRadiusClass} border transition-all flex flex-col justify-between select-none ${
                              isLight
                                ? "bg-white text-slate-800 shadow-sm hover:border-slate-300"
                                : isAmoled
                                ? "bg-neutral-950 text-white border-neutral-900"
                                : `bg-neutral-900/80 text-white ${colorStyle.className}`
                            } ${
                              snapshot.isDragging
                                ? "ring-2 scale-[1.02] z-50 shadow-2xl"
                                : "cursor-grab active:cursor-grabbing hover:scale-[1.01]"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div
                                style={{
                                  backgroundColor: isLight ? "#f1f5f9" : "rgba(23, 23, 23, 0.8)",
                                  borderColor: `${btnAccentColor}33`,
                                }}
                                className={`h-9 w-9 ${buttonRadiusClass} border flex items-center justify-center group-hover:scale-105 transition-transform`}
                              >
                                {hasBase64 ? (
                                  <img
                                    src={getBase64Src(btn.icon)}
                                    alt=""
                                    className="w-5 h-5 object-contain rounded"
                                  />
                                ) : (
                                  <Icon
                                    style={{ color: btnAccentColor }}
                                    fill={isFilled ? "currentColor" : "none"}
                                    strokeWidth={isFilled ? 2.5 : 2}
                                    className={`${iconSizeClass} transition-all`}
                                  />
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <GripVertical className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEdit(btn);
                                  }}
                                  title="Configurar Botão"
                                  className={`p-1.5 rounded-lg border border-transparent transition-colors ${
                                    isLight
                                      ? "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800"
                                      : "bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                                  }`}
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {showLabels && (
                              <div className="mt-auto pt-2 min-w-0">
                                <h4
                                  title={btn.label}
                                  className={`font-semibold tracking-tight truncate w-full ${labelFontSizeClass.title} ${
                                    isLight ? "text-slate-800" : "text-neutral-100"
                                  }`}
                                >
                                  {btn.label}
                                </h4>
                              </div>
                            )}
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}

                {/* Slot Vazio / Novo Botão */}
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  style={{ minHeight: `${minCardHeight}px` }}
                  className={`border-2 border-dashed ${buttonRadiusClass} flex flex-col items-center justify-center gap-1.5 p-4 transition-colors cursor-pointer ${
                    isLight
                      ? "border-slate-300 hover:border-slate-400 hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                      : "border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/30 text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <Plus className="w-5 h-5 text-neutral-400" />
                  <span className="text-xs font-medium">+ Novo Botão</span>
                </button>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Sheet Lateral de Criação e Edição */}
      <ButtonEditorSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        buttonToEdit={selectedButton}
      />
    </main>
  );
}

export default CentralArea;
