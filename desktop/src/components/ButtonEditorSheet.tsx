import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Sparkles,
  Search,
  Loader2,
  Trash2,
  Save,
  Check,
  Zap,
  Globe,
  Terminal,
  FolderOpen,
  Volume2,
  Play,
  Calculator,
  Laptop,
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

const LUCIDE_ICON_OPTIONS = [
  { id: "zap", label: "Zap", icon: Zap },
  { id: "calculator", label: "Calculadora", icon: Calculator },
  { id: "browser", label: "Navegador", icon: Globe },
  { id: "terminal", label: "Terminal", icon: Terminal },
  { id: "folder", label: "Pasta", icon: FolderOpen },
  { id: "volume-2", label: "Volume", icon: Volume2 },
  { id: "play", label: "Play/Pause", icon: Play },
  { id: "sparkles", label: "Brilho", icon: Sparkles },
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
  const [actionType, setActionType] = useState<"open_app" | "open_url" | "hotkey" | "webhook">("open_app");
  const [command, setCommand] = useState("");
  const [color, setColor] = useState("sky");
  const [icon, setIcon] = useState("zap");
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
      setShowScanner(false);
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
      setIcon(`base64:${base64Data}`);
    } else {
      setIcon("laptop");
    }
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

  const filteredApps = appsList.filter((a) => {
    const q = appSearchQuery.toLowerCase();
    const name = (a.nome_amigavel || a.name || "").toLowerCase();
    const proc = (a.process || a.path || "").toLowerCase();
    return name.includes(q) || proc.includes(q);
  });

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
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[420px] sm:max-w-md bg-neutral-900 border-neutral-800 text-neutral-100 flex flex-col justify-between overflow-y-auto"
      >
        <div>
          <SheetHeader className="pb-4 border-b border-neutral-800">
            <SheetTitle className="text-base text-neutral-100 font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>{buttonToEdit ? "Editar Botão" : "Criar Novo Botão"}</span>
            </SheetTitle>
            <SheetDescription className="text-xs text-neutral-400">
              Configure ações nativas, atalhos de sistema e aparência personalizada.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} id="button-editor-form" className="space-y-4 py-4">
            {/* Rótulo */}
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-300">Rótulo do Botão</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Calculadora, Discord, Mudo..."
                required
                className="bg-neutral-950/80 border-neutral-800 text-neutral-100 text-xs h-9 focus-visible:ring-1 focus-visible:ring-sky-500"
              />
            </div>

            {/* Ação */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-neutral-300">Tipo de Ação</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleScanApps}
                  disabled={isScanning}
                  className="h-6 text-[11px] px-2 gap-1 border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                >
                  {isScanning ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Laptop className="w-3 h-3" />
                  )}
                  <span>Escanear PC</span>
                </Button>
              </div>

              <Select
                value={actionType}
                onValueChange={(val: "open_app" | "open_url" | "hotkey" | "webhook") => setActionType(val)}
              >
                <SelectTrigger className="bg-neutral-950/80 border-neutral-800 text-neutral-200 text-xs h-9">
                  <SelectValue placeholder="Selecione o tipo de ação" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200 text-xs">
                  <SelectItem value="open_app">Abrir Aplicativo (open_app)</SelectItem>
                  <SelectItem value="open_url">Abrir Link / URL (open_url)</SelectItem>
                  <SelectItem value="hotkey">Atalho do Teclado (hotkey)</SelectItem>
                  <SelectItem value="webhook">Webhook HTTP (webhook)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scanner de Aplicativos Integrado */}
            {showScanner && (
              <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-sky-400 flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Aplicativos Detectados ({appsList.length})</span>
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-neutral-700 text-neutral-400 font-mono">
                    Windows Scanner
                  </Badge>
                </div>

                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                  <Input
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    placeholder="Filtrar aplicativo detectado..."
                    className="h-7 pl-7 text-[11px] bg-neutral-900 border-neutral-800 text-neutral-200"
                  />
                </div>

                <ScrollArea className="h-40 border border-neutral-800/80 rounded-md p-1.5 bg-neutral-900/60">
                  {isScanning ? (
                    <div className="h-full flex items-center justify-center py-8 text-neutral-400 text-xs gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                      <span>Varrendo Menu Iniciar e Desktop...</span>
                    </div>
                  ) : filteredApps.length > 0 ? (
                    <div className="space-y-1">
                      {filteredApps.map((app, idx) => {
                        const iconData = app.icone_base64 || app.icon_base64;
                        return (
                          <button
                            key={`${app.name}-${idx}`}
                            type="button"
                            onClick={() => handleSelectApp(app)}
                            className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-sky-500/10 border border-transparent hover:border-sky-500/20 text-left transition-colors group"
                          >
                            {iconData ? (
                              <img
                                src={`data:image/png;base64,${iconData}`}
                                alt=""
                                className="w-5 h-5 rounded object-contain flex-shrink-0"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded bg-neutral-800 flex items-center justify-center text-neutral-400 flex-shrink-0">
                                <Laptop className="w-3 h-3" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium text-neutral-200 truncate group-hover:text-sky-300">
                                {app.nome_amigavel || app.name}
                              </p>
                              <p className="text-[9px] font-mono text-neutral-500 truncate">
                                {app.process || app.path}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-neutral-500 text-[11px]">
                      Nenhum aplicativo encontrado
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* Comando / Destino Dinâmico */}
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-300">Comando / Destino</Label>
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder={getPlaceholder()}
                required
                className="bg-neutral-950/80 border-neutral-800 text-neutral-100 text-xs h-9 focus-visible:ring-1 focus-visible:ring-sky-500 font-mono"
              />
            </div>

            {/* Seletor de Cores */}
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-300">Tema do Botão</Label>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected = color === preset.name;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setColor(preset.name)}
                      className={`h-7 w-7 rounded-full flex items-center justify-center transition-all ${preset.bg} ${
                        isSelected ? `ring-2 ring-white scale-110 shadow-lg` : "opacity-80 hover:opacity-100"
                      }`}
                      title={preset.label}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seletor de Ícones */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-neutral-300">Ícone</Label>
                {isBase64Icon(icon) && (
                  <button
                    type="button"
                    onClick={() => setIcon("zap")}
                    className="text-[10px] text-sky-400 hover:underline"
                  >
                    Usar ícone padrão
                  </button>
                )}
              </div>

              {isBase64Icon(icon) ? (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                  <img
                    src={getBase64Src(icon)}
                    alt="App Icon"
                    className="w-8 h-8 rounded object-contain border border-neutral-700/50 p-1 bg-neutral-900"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-200 font-medium">Ícone Nativo Extraído</p>
                    <p className="text-[10px] font-mono text-neutral-500">Base64 Windows Icon</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {LUCIDE_ICON_OPTIONS.map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = icon === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setIcon(opt.id)}
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                          isSelected
                            ? "bg-sky-500/15 border-sky-500/50 text-sky-300 shadow-sm"
                            : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[10px] truncate max-w-full">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Rodapé de Ações */}
        <SheetFooter className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-2 sm:justify-between">
          {buttonToEdit ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="gap-1.5 h-8 text-xs bg-red-950/60 border border-red-800/60 hover:bg-red-900 text-red-200"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Excluir</span>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs text-neutral-400 hover:text-neutral-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="button-editor-form"
              size="sm"
              disabled={isSubmitting || !label.trim()}
              className="h-8 text-xs gap-1.5 bg-sky-500 hover:bg-sky-400 text-white shadow-sm shadow-sky-500/20"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{buttonToEdit ? "Salvar Alterações" : "Criar Botão"}</span>
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default ButtonEditorSheet;

