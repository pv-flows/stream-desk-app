import React, { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Sparkles,
  Search,
  Loader2,
  Trash2,
  Save,
  Check,
  Laptop,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DeckButton, useDashboardStore } from "@/store/useDashboardStore";
import { isBase64Icon, getBase64Src } from "@/lib/buttonUtils";
import {
  ICON_CATALOG,
  ICON_CATEGORIES,
  type IconCategory,
} from "@/lib/iconCatalog";

export interface InstalledApp {
  name: string;
  process: string;
  path: string;
  icon_base64: string;
  nome_amigavel: string;
  icone_base64: string;
}

export interface ButtonEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buttonToEdit?: DeckButton | null;
  targetPageIndex?: number;
}

const COLOR_PRESETS = [
  { name: "sky", label: "Sky", bg: "bg-sky-500", border: "border-sky-400" },
  { name: "emerald", label: "Emerald", bg: "bg-emerald-500", border: "border-emerald-400" },
  { name: "amber", label: "Amber", bg: "bg-amber-500", border: "border-amber-400" },
  { name: "purple", label: "Purple", bg: "bg-purple-500", border: "border-purple-400" },
  { name: "rose", label: "Rose", bg: "bg-rose-500", border: "border-rose-400" },
  { name: "blue", label: "Blue", bg: "bg-blue-600", border: "border-blue-500" },
  { name: "slate", label: "Slate", bg: "bg-slate-600", border: "border-slate-400" },
];

export function ButtonEditorSheet({
  open,
  onOpenChange,
  buttonToEdit,
  targetPageIndex,
}: ButtonEditorSheetProps) {
  const fetchButtons = useDashboardStore((s) => s.fetchButtons);
  const activePageIndex = useDashboardStore((s) => s.activePageIndex);
  const buttons = useDashboardStore((s) => s.buttons);

  const [label, setLabel] = useState("");
  const [actionType, setActionType] = useState<"open_app" | "open_url" | "hotkey" | "webhook" | "obs">("open_app");
  const [command, setCommand] = useState("");
  const [color, setColor] = useState("sky");
  const [icon, setIcon] = useState("zap");
  const [nativeIconBase64, setNativeIconBase64] = useState<string | null>(null);

  // Icon catalog filters
  const [iconSearchQuery, setIconSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<IconCategory | "all">("all");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // App scanner states
  const [appsList, setAppsList] = useState<InstalledApp[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [appSearchQuery, setAppSearchQuery] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  // Prepopulate form when opened
  useEffect(() => {
    if (!open) return;

    if (buttonToEdit) {
      setLabel(buttonToEdit.label);
      setColor(buttonToEdit.color || "sky");
      setIcon(buttonToEdit.icon || "zap");

      if (isBase64Icon(buttonToEdit.icon)) {
        setNativeIconBase64(buttonToEdit.icon);
      } else {
        setNativeIconBase64(null);
      }

      const act = buttonToEdit.action_name || "";
      if (act.startsWith("open_app:")) {
        setActionType("open_app");
        setCommand(act.slice("open_app:".length));
      } else if (act.startsWith("open_url:")) {
        setActionType("open_url");
        setCommand(act.slice("open_url:".length));
      } else if (act.startsWith("hotkey:")) {
        setActionType("hotkey");
        setCommand(act.slice("hotkey:".length));
      } else if (act.startsWith("webhook:")) {
        setActionType("webhook");
        setCommand(act.slice("webhook:".length));
      } else if (act.startsWith("obs:")) {
        setActionType("obs");
        setCommand(act.slice("obs:".length));
      } else {
        setActionType("open_app");
        setCommand(act);
      }
    } else {
      setLabel("");
      setActionType("open_app");
      setCommand("");
      setColor("sky");
      setIcon("zap");
      setNativeIconBase64(null);
      setShowScanner(false);
      setIconSearchQuery("");
      setSelectedCategory("all");
    }
  }, [open, buttonToEdit]);

  const handleScanApps = async () => {
    setIsScanning(true);
    setShowScanner(true);
    try {
      const scanned = await invoke<InstalledApp[]>("get_installed_apps");
      if (Array.isArray(scanned)) {
        setAppsList(scanned);
      }
    } catch (err) {
      console.error("[Scanner] Falha ao invocar get_installed_apps:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectApp = (app: InstalledApp) => {
    const friendlyName = app.nome_amigavel || app.name || "Aplicativo";
    const appTarget = app.path || app.process;
    setLabel(friendlyName);
    setActionType("open_app");
    setCommand(appTarget);

    const base64Data = app.icone_base64 || app.icon_base64;
    if (base64Data) {
      const b64 = `base64:${base64Data}`;
      setNativeIconBase64(b64);
      setIcon(b64);
    } else {
      setIcon("laptop");
    }
    setShowScanner(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    setIsSubmitting(true);
    try {
      let finalAction = command.trim();
      if (actionType === "open_app" && !finalAction.startsWith("open_app:")) {
        finalAction = `open_app:${finalAction}`;
      } else if (actionType === "open_url" && !finalAction.startsWith("open_url:")) {
        finalAction = `open_url:${finalAction}`;
      } else if (actionType === "hotkey" && !finalAction.startsWith("hotkey:")) {
        finalAction = `hotkey:${finalAction}`;
      } else if (actionType === "webhook" && !finalAction.startsWith("webhook:")) {
        finalAction = `webhook:${finalAction}`;
      } else if (actionType === "obs" && !finalAction.startsWith("obs:")) {
        finalAction = `obs:${finalAction}`;
      }

      const currentPage = targetPageIndex ?? buttonToEdit?.page_index ?? activePageIndex;
      const currentPos = buttonToEdit?.position ?? buttons.filter((b) => b.page_index === currentPage).length;

      if (buttonToEdit) {
        await invoke("update_button", {
          id: buttonToEdit.id,
          label: label.trim(),
          actionName: finalAction,
          color: color,
          icon: icon || "zap",
          pageIndex: currentPage,
          position: currentPos,
        });
      } else {
        await invoke("add_button", {
          label: label.trim(),
          actionName: finalAction,
          color: color,
          icon: icon || "zap",
          pageIndex: currentPage,
          position: currentPos,
        });
      }

      await fetchButtons();
      onOpenChange(false);
    } catch (err) {
      console.error("[ButtonEditorSheet] Erro ao salvar botão:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!buttonToEdit) return;
    setIsDeleting(true);
    try {
      await invoke("delete_button", { id: buttonToEdit.id });
      await fetchButtons();
      onOpenChange(false);
    } catch (err) {
      console.error("[ButtonEditorSheet] Erro ao excluir botão:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredApps = useMemo(() => {
    const q = appSearchQuery.toLowerCase().trim();
    if (!q) return appsList;
    return appsList.filter((a) => {
      const name = (a.nome_amigavel || a.name || "").toLowerCase();
      const proc = (a.process || a.path || "").toLowerCase();
      return name.includes(q) || proc.includes(q);
    });
  }, [appsList, appSearchQuery]);

  const filteredIcons = useMemo(() => {
    const q = iconSearchQuery.toLowerCase().trim();
    return ICON_CATALOG.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.toLowerCase().includes(q))
      );
    });
  }, [iconSearchQuery, selectedCategory]);

  const getPlaceholder = () => {
    switch (actionType) {
      case "open_app":
        return "Ex: calc, notepad, C:\\Program Files\\...\\app.exe";
      case "open_url":
        return "Ex: https://google.com, https://twitch.tv";
      case "hotkey":
        return "Ex: ctrl+shift+m, alt+tab, f11, win+d";
      case "webhook":
        return "Ex: http://192.168.1.100:8123/api/webhook/...";
      case "obs":
        return "Ex: toggle_record, toggle_stream, switch_scene:Cena";
    }
  };

  const isCurrentNative = isBase64Icon(icon);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[420px] sm:max-w-md bg-neutral-900 border-neutral-800 text-neutral-100 flex flex-col justify-between p-4 sm:p-5 overflow-y-auto"
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Cabeçalho Compacto */}
          <SheetHeader className="pb-2 border-b border-neutral-800 space-y-0.5 text-left">
            <SheetTitle className="text-sm text-neutral-100 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>{buttonToEdit ? "Editar Botão" : "Criar Novo Botão"}</span>
            </SheetTitle>
            <SheetDescription className="text-[11px] text-neutral-400 leading-tight">
              Configure ações nativas, atalhos de sistema e aparência personalizada.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} id="button-editor-form" className="space-y-2.5 py-2.5 flex-1 flex flex-col justify-between">
            {/* Rótulo do Botão */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-neutral-300">Rótulo do Botão</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Calculadora, Discord, Mudo..."
                required
                className="bg-neutral-950/80 border-neutral-800 text-neutral-100 text-xs h-8 py-1 focus-visible:ring-1 focus-visible:ring-sky-500"
              />
            </div>

            {/* Tipo de Ação com Botão Escanear PC Compacto */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-medium text-neutral-300">Tipo de Ação</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleScanApps}
                  disabled={isScanning}
                  className="h-5 text-[10px] px-2 gap-1 border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                >
                  {isScanning ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    <Laptop className="w-2.5 h-2.5" />
                  )}
                  <span>Escanear PC</span>
                </Button>
              </div>

              <Select
                value={actionType}
                onValueChange={(val: "open_app" | "open_url" | "hotkey" | "webhook" | "obs") => setActionType(val)}
              >
                <SelectTrigger className="bg-neutral-950/80 border-neutral-800 text-neutral-200 text-xs h-8">
                  <SelectValue placeholder="Selecione o tipo de ação" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200 text-xs">
                  <SelectItem value="open_app">Abrir Aplicativo (open_app)</SelectItem>
                  <SelectItem value="open_url">Abrir Link / URL (open_url)</SelectItem>
                  <SelectItem value="hotkey">Atalho do Teclado (hotkey)</SelectItem>
                  <SelectItem value="webhook">Webhook HTTP (webhook)</SelectItem>
                  <SelectItem value="obs">OBS Studio WebSocket v5 (obs)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scanner de Aplicativos Integrado (Drawer Opcional) */}
            {showScanner && (
              <div className="p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/90 space-y-1.5 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-sky-400 flex items-center gap-1">
                    <Laptop className="w-3 h-3" />
                    <span>Aplicativos Detectados ({appsList.length})</span>
                  </span>
                  <Badge variant="outline" className="text-[8px] px-1 py-0 border-neutral-700 text-neutral-400 font-mono">
                    Windows
                  </Badge>
                </div>

                <div className="relative">
                  <Search className="w-2.5 h-2.5 absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                  <Input
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    placeholder="Filtrar aplicativo detectado..."
                    className="h-6 pl-6 text-[10px] bg-neutral-900 border-neutral-800 text-neutral-200"
                  />
                </div>

                <ScrollArea className="h-32 border border-neutral-800/80 rounded p-1 bg-neutral-900/60">
                  {isScanning ? (
                    <div className="h-full flex items-center justify-center py-6 text-neutral-400 text-[11px] gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                      <span>Varrendo atalhos do Windows...</span>
                    </div>
                  ) : filteredApps.length > 0 ? (
                    <div className="space-y-0.5">
                      {filteredApps.map((app, idx) => {
                        const iconData = app.icone_base64 || app.icon_base64;
                        return (
                          <button
                            key={`${app.name}-${idx}`}
                            type="button"
                            onClick={() => handleSelectApp(app)}
                            className="w-full flex items-center gap-2 p-1 rounded hover:bg-sky-500/10 border border-transparent hover:border-sky-500/20 text-left transition-colors group"
                          >
                            {iconData ? (
                              <img
                                src={`data:image/png;base64,${iconData}`}
                                alt=""
                                className="w-4 h-4 rounded object-contain flex-shrink-0"
                              />
                            ) : (
                              <div className="w-4 h-4 rounded bg-neutral-800 flex items-center justify-center text-neutral-400 flex-shrink-0">
                                <Laptop className="w-2.5 h-2.5" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-medium text-neutral-200 truncate group-hover:text-sky-300">
                                {app.nome_amigavel || app.name}
                              </p>
                              <p className="text-[8px] font-mono text-neutral-500 truncate">
                                {app.process || app.path}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-neutral-500 text-[10px]">
                      Nenhum aplicativo encontrado
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* Comando / Destino */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-neutral-300">Comando / Destino</Label>
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder={getPlaceholder()}
                required
                className="bg-neutral-950/80 border-neutral-800 text-neutral-100 text-xs h-8 py-1 focus-visible:ring-1 focus-visible:ring-sky-500 font-mono"
              />
            </div>

            {/* Tema do Botão (Swatches Compactos) */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-neutral-300">Tema do Botão</Label>
              <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected = color === preset.name;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setColor(preset.name)}
                      className={`h-5 w-5 rounded-full flex items-center justify-center transition-all ${preset.bg} ${
                        isSelected ? "ring-2 ring-white scale-110 shadow" : "opacity-75 hover:opacity-100"
                      }`}
                      title={preset.label}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Biblioteca de Ícones Categorizada (Grade com 3 Linhas Visíveis) */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label className="text-[11px] font-medium text-neutral-300">Biblioteca de Ícones</Label>
                  <span className="text-[9px] text-neutral-500">({filteredIcons.length})</span>
                </div>

                {/* Toggle de Ícone Nativo (Base64) se disponível */}
                {nativeIconBase64 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isCurrentNative) {
                        setIcon("zap");
                      } else {
                        setIcon(nativeIconBase64);
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                      isCurrentNative
                        ? "bg-sky-500/20 border-sky-500/50 text-sky-300"
                        : "bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                    }`}
                    title={isCurrentNative ? "Clique para usar ícone Lucide" : "Restaurar ícone extraído do app"}
                  >
                    <ImageIcon className="w-2.5 h-2.5" />
                    <span>{isCurrentNative ? "EXE Nativo Ativo" : "Usar EXE"}</span>
                  </button>
                )}
              </div>

              {/* Barra de Busca Instantânea */}
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                <Input
                  value={iconSearchQuery}
                  onChange={(e) => setIconSearchQuery(e.target.value)}
                  placeholder="Buscar ícone (ex: play, web, som, git, home)..."
                  className="h-7 pl-7 text-[11px] bg-neutral-950/90 border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-sky-500"
                />
              </div>

              {/* Pills Horizontais de Categoria */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                {ICON_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`h-5 text-[10px] px-2 rounded-full border transition-colors whitespace-nowrap font-medium ${
                        isActive
                          ? "bg-sky-500/20 border-sky-500/50 text-sky-300"
                          : "bg-neutral-950/60 border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Grade de Ícones com Altura Travada para 3 Linhas Visíveis */}
              {isCurrentNative ? (
                <div className="h-[132px] p-2.5 rounded-lg bg-neutral-950/90 border border-neutral-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={getBase64Src(icon)}
                      alt="App Icon"
                      className="w-10 h-10 rounded object-contain border border-neutral-700/60 p-1 bg-neutral-900 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-200 font-medium truncate">Ícone Nativo do Windows</p>
                      <p className="text-[10px] font-mono text-neutral-500 truncate">Extraído via scanner binário</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIcon("zap")}
                    className="h-7 text-[10px] px-2 gap-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800 flex-shrink-0"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Usar Lucide</span>
                  </Button>
                </div>
              ) : (
                <div
                  className="h-[132px] overflow-y-auto pr-1 grid grid-cols-4 gap-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-neutral-700"
                >
                  {filteredIcons.map((item) => {
                    const IconComp = item.component;
                    const isSelected = icon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setIcon(item.id)}
                        className={`h-[38px] flex flex-col items-center justify-center gap-0.5 p-1 rounded-md border text-center transition-all ${
                          isSelected
                            ? "bg-sky-500/20 border-sky-500/60 text-sky-300 shadow-sm ring-1 ring-sky-500/30"
                            : "bg-neutral-950/60 border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 hover:bg-neutral-900"
                        }`}
                        title={`${item.label} (${item.id})`}
                      >
                        <IconComp className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-[9px] leading-tight truncate w-full px-0.5">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                  {filteredIcons.length === 0 && (
                    <div className="col-span-4 h-full flex flex-col items-center justify-center py-6 text-neutral-500 text-[11px]">
                      Nenhum ícone encontrado
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Rodapé Compacto com Botões Imediatamente Visíveis */}
        <SheetFooter className="pt-2.5 pb-0.5 border-t border-neutral-800 flex items-center justify-between gap-2 sm:justify-between flex-shrink-0">
          {buttonToEdit ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="gap-1 h-7 text-xs bg-red-950/60 border border-red-800/60 hover:bg-red-900 text-red-200"
            >
              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              <span>Excluir</span>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-7 text-xs text-neutral-400 hover:text-neutral-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="button-editor-form"
              size="sm"
              disabled={isSubmitting || !label.trim()}
              className="h-7 text-xs gap-1.5 bg-sky-500 hover:bg-sky-400 text-white shadow-sm shadow-sky-500/20"
            >
              {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              <span>{buttonToEdit ? "Salvar Alterações" : "Criar Botão"}</span>
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default ButtonEditorSheet;
