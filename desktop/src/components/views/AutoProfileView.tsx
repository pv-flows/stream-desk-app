import React, { useState } from "react";
import {
  Plus,
  ArrowRight,
  Globe,
  Music,
  Code,
  Play,
  Laptop,
  Trash2,
  Check,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStore } from "@/store/useDashboardStore";
import { getAccentColor } from "@/lib/buttonUtils";

function getProcessIcon(processName: string): LucideIcon {
  const p = processName.toLowerCase();
  if (p.includes("chrome") || p.includes("brave") || p.includes("edge") || p.includes("firefox") || p.includes("browser")) {
    return Globe;
  }
  if (p.includes("spotify") || p.includes("music") || p.includes("audio")) {
    return Music;
  }
  if (p.includes("code") || p.includes("cursor") || p.includes("terminal") || p.includes("dev")) {
    return Code;
  }
  if (p.includes("youtube") || p.includes("vlc") || p.includes("video") || p.includes("play")) {
    return Play;
  }
  return Laptop;
}

export function AutoProfileView() {
  const { toast } = useToast();
  const windowRules = useDashboardStore((s) => s.windowRules);
  const pages = useDashboardStore((s) => s.pages);
  const addWindowRule = useDashboardStore((s) => s.addWindowRule);
  const toggleWindowRule = useDashboardStore((s) => s.toggleWindowRule);
  const deleteWindowRule = useDashboardStore((s) => s.deleteWindowRule);

  const theme = useDashboardStore((s) => s.theme);
  const appearance = useDashboardStore((s) => s.appearance);
  const normalizedTheme = (appearance?.theme || theme || "escuro").toLowerCase();
  const isLight = normalizedTheme === "claro" || normalizedTheme === "light";
  const isAmoled = normalizedTheme === "amoled";
  const accent = getAccentColor(appearance?.accent_color);

  const [isAdding, setIsAdding] = useState(false);
  const [newProcessName, setNewProcessName] = useState("");
  const [newTargetPageIndex, setNewTargetPageIndex] = useState<number>(pages[0]?.id ?? 1);

  const handleToggleAdd = () => {
    setIsAdding((prev) => !prev);
    setNewProcessName("");
    setNewTargetPageIndex(pages[0]?.id ?? 1);
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newProcessName.trim();
    if (!trimmed) {
      toast({
        variant: "destructive",
        title: "Nome do processo obrigatório",
        description: "Digite o nome do executável (ex: chrome.exe, code.exe).",
      });
      return;
    }

    await addWindowRule(trimmed, newTargetPageIndex);
    setIsAdding(false);
    setNewProcessName("");

    const targetPageName = pages.find((p) => p.id === newTargetPageIndex)?.name ?? `Página ${newTargetPageIndex}`;
    toast({
      title: "Regra Criada",
      description: `Quando ${trimmed} estiver em foco, o layout alternará para "${targetPageName}".`,
    });
  };

  const handleChangeTargetPage = async (
    ruleId: number,
    processName: string,
    targetPageStr: string,
    enabled: boolean
  ) => {
    const pageId = parseInt(targetPageStr, 10);
    await deleteWindowRule(ruleId);
    await addWindowRule(processName, pageId);
    if (!enabled) {
      const updatedRules = useDashboardStore.getState().windowRules;
      const created = updatedRules.find((r) => r.process_name === processName && r.page_index === pageId);
      if (created) {
        await toggleWindowRule(created.id, false);
      }
    }
    toast({
      title: "Destino Atualizado",
      description: `Página associada alterada com sucesso.`,
    });
  };

  const handleToggleRule = async (ruleId: number, enabled: boolean) => {
    await toggleWindowRule(ruleId, enabled);
    toast({
      title: enabled ? "Regra Ativada" : "Regra Desativada",
      description: enabled
        ? "O perfil mudará automaticamente quando este app estiver focado."
        : "Esta regra foi desativada e não acionará trocas de perfil.",
    });
  };

  const handleDeleteRule = async (ruleId: number) => {
    await deleteWindowRule(ruleId);
    toast({
      title: "Regra Excluída",
      description: "A regra de perfil automático foi removida com sucesso.",
    });
  };

  const cardBgClass = isLight
    ? "bg-white border-slate-200/90 shadow-sm"
    : isAmoled
    ? "bg-neutral-950 border-neutral-900 shadow-sm"
    : "bg-neutral-900/50 border-neutral-800/80 shadow-sm backdrop-blur-sm";

  const textPrimaryClass = isLight ? "text-slate-800" : isAmoled ? "text-white" : "text-neutral-100";
  const textSecondaryClass = isLight ? "text-slate-500" : "text-neutral-400";

  return (
    <div
      className={`flex-1 flex flex-col min-w-0 p-6 md:p-8 overflow-y-auto select-none transition-colors duration-200 ${
        isLight
          ? "bg-slate-50/90 text-slate-900"
          : isAmoled
          ? "bg-black text-white"
          : "bg-neutral-950/70 text-neutral-100"
      }`}
    >
      <div className="space-y-6 max-w-3xl mx-auto w-full flex-1">
        {/* 1. Header: Título "Perfis automáticos" e Botão "+ Nova regra" */}
        <header className="flex items-center justify-between pb-4">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${textPrimaryClass}`}>
              Perfis automáticos
            </h1>
            <p className={`text-xs mt-1 ${textSecondaryClass}`}>
              Troca inteligente de páginas conforme o programa em foco no Windows
            </p>
          </div>

          <Button
            size="sm"
            onClick={handleToggleAdd}
            style={{
              backgroundColor: accent.hex,
              color: "#ffffff",
              boxShadow: `0 4px 14px ${accent.hex}35`,
            }}
            className="h-9 px-4 rounded-xl font-medium text-xs gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nova regra</span>
          </Button>
        </header>

        {/* Formulário Inline para Nova Regra */}
        {isAdding && (
          <form
            onSubmit={handleCreateRule}
            style={{ borderColor: accent.hex }}
            className={`border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg backdrop-blur-md ${
              isLight ? "bg-white" : "bg-neutral-900/80"
            }`}
          >
            <div className="flex items-center gap-2 flex-1 w-full min-w-0">
              <input
                type="text"
                value={newProcessName}
                onChange={(e) => setNewProcessName(e.target.value)}
                placeholder="Nome do executável (ex: chrome.exe, code.exe)"
                autoFocus
                className={`flex-1 h-9 px-3 rounded-xl border text-xs focus:outline-none font-mono ${
                  isLight
                    ? "bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400"
                    : "bg-neutral-950 border-neutral-700 text-neutral-100 placeholder:text-neutral-500"
                }`}
              />

              <Select
                value={String(newTargetPageIndex)}
                onValueChange={(val) => setNewTargetPageIndex(parseInt(val, 10))}
              >
                <SelectTrigger
                  className={`w-40 h-9 text-xs rounded-xl ${
                    isLight
                      ? "bg-slate-50 border-slate-300 text-slate-800"
                      : "bg-neutral-950 border-neutral-700 text-neutral-200"
                  }`}
                >
                  <SelectValue placeholder="Página destino" />
                </SelectTrigger>
                <SelectContent
                  className={`text-xs rounded-xl ${
                    isLight ? "bg-white border-slate-200" : "bg-neutral-900 border-neutral-800"
                  }`}
                >
                  {pages.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                type="submit"
                size="sm"
                style={{ backgroundColor: accent.hex, color: "#ffffff" }}
                className="h-8 px-3 rounded-xl text-xs gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Salvar</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAdding(false)}
                className={`h-8 px-2 text-xs ${textSecondaryClass}`}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        )}

        {/* 2. Cabeçalho da Lista */}
        <div className={`px-5 flex items-center justify-between text-xs font-medium ${textSecondaryClass}`}>
          <span className="w-1/3">App / Processo</span>
          <span className="w-1/3 text-center">Destino</span>
          <span className="w-1/3 text-right">Status</span>
        </div>

        {/* 3. Linhas da Lista Conectadas ao Zustand e IPC */}
        <div className="space-y-3">
          {windowRules.length > 0 ? (
            windowRules.map((rule) => {
              const IconComponent = getProcessIcon(rule.process_name);

              return (
                <div
                  key={rule.id}
                  className={`border rounded-2xl px-5 py-4 flex items-center justify-between transition-all group ${cardBgClass} ${
                    !rule.enabled ? "opacity-60" : ""
                  }`}
                >
                  {/* Esquerda: Ícone em círculo + nome do executável */}
                  <div className="w-1/3 flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 shadow-inner ${
                        isLight
                          ? "bg-slate-100 border-slate-200"
                          : "bg-neutral-800/90 border-neutral-700/60"
                      }`}
                    >
                      <IconComponent style={{ color: accent.hex }} className="w-4 h-4" />
                    </div>
                    <span className={`text-sm font-mono truncate ${textPrimaryClass}`}>
                      {rule.process_name}
                    </span>
                  </div>

                  {/* Centro: Seta + Select de página de destino */}
                  <div className="w-1/3 flex items-center justify-center gap-3">
                    <ArrowRight style={{ color: accent.hex }} className="w-4 h-4 flex-shrink-0" />
                    <Select
                      value={String(rule.page_index)}
                      onValueChange={(val) =>
                        handleChangeTargetPage(
                          rule.id,
                          rule.process_name,
                          val,
                          rule.enabled
                        )
                      }
                    >
                      <SelectTrigger
                        className={`w-36 h-9 text-xs rounded-xl ${
                          isLight
                            ? "bg-slate-100 border-slate-200 text-slate-800"
                            : "bg-neutral-950/80 border-neutral-800 text-neutral-200"
                        }`}
                      >
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent
                        className={`text-xs rounded-xl ${
                          isLight ? "bg-white border-slate-200" : "bg-neutral-900 border-neutral-800"
                        }`}
                      >
                        {pages.map((page) => (
                          <SelectItem key={page.id} value={String(page.id)}>
                            {page.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Direita: Switch ligado/desligado e botão de exclusão */}
                  <div className="w-1/3 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      title="Excluir regra"
                      className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all ${
                        isLight
                          ? "hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                          : "hover:bg-red-950/60 text-neutral-400 hover:text-red-400"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                      title={rule.enabled ? "Regra ativa" : "Regra inativa"}
                      className={`data-[state=checked]:bg-emerald-500 ${
                        isLight
                          ? "data-[state=unchecked]:bg-slate-300 border-slate-300"
                          : "data-[state=unchecked]:bg-neutral-800 border-neutral-700"
                      }`}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div
              className={`text-center py-12 border border-dashed rounded-2xl ${
                isLight
                  ? "border-slate-300 bg-slate-100/50 text-slate-500"
                  : "border-neutral-800/80 bg-neutral-900/20 text-neutral-400"
              }`}
            >
              <Laptop className="w-8 h-8 opacity-40 mx-auto mb-2" />
              <p className={`text-xs font-medium ${textSecondaryClass}`}>
                Nenhuma regra de perfil automático cadastrada.
              </p>
              <button
                type="button"
                onClick={handleToggleAdd}
                style={{ color: accent.hex }}
                className="mt-2 text-xs hover:underline font-medium"
              >
                + Adicionar primeira regra
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Rodapé */}
      <footer className="mt-auto pt-10 pb-2 text-center">
        <p className={`text-xs leading-relaxed max-w-lg mx-auto ${textSecondaryClass}`}>
          Dica: Adicione regras para que o app mude de página automaticamente
          baseado no aplicativo focado.
        </p>
      </footer>
    </div>
  );
}

export default AutoProfileView;
