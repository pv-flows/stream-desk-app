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
import { useDashboardStore } from "@/store/useDashboardStore";

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
  const windowRules = useDashboardStore((s) => s.windowRules);
  const pages = useDashboardStore((s) => s.pages);
  const addWindowRule = useDashboardStore((s) => s.addWindowRule);
  const deleteWindowRule = useDashboardStore((s) => s.deleteWindowRule);

  // Estados locais para criação rápida de regra
  const [isAdding, setIsAdding] = useState(false);
  const [newProcessName, setNewProcessName] = useState("");
  const [newTargetPageIndex, setNewTargetPageIndex] = useState<number>(
    pages[0]?.id ?? 1
  );

  const handleToggleAdd = () => {
    setIsAdding((prev) => !prev);
    setNewProcessName("");
    if (pages.length > 0) {
      setNewTargetPageIndex(pages[0].id);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newProcessName.trim();
    if (!trimmed) return;

    await addWindowRule(trimmed, newTargetPageIndex);
    setNewProcessName("");
    setIsAdding(false);
  };

  const handleChangeTargetPage = async (ruleId: number, processName: string, newPageIdStr: string) => {
    const newPageId = parseInt(newPageIdStr, 10);
    if (isNaN(newPageId)) return;
    await deleteWindowRule(ruleId);
    await addWindowRule(processName, newPageId);
  };

  const handleDeleteRule = async (ruleId: number) => {
    await deleteWindowRule(ruleId);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-neutral-950/70 p-8 overflow-y-auto select-none justify-between">
      <div className="space-y-6 max-w-4xl">
        {/* 1. Header: Título "Perfis automáticos" e Botão "+ Nova regra" */}
        <header className="flex items-center justify-between pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            Perfis automáticos
          </h1>

          <Button
            size="sm"
            onClick={handleToggleAdd}
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nova regra</span>
          </Button>
        </header>

        {/* Formulário Inline para Nova Regra */}
        {isAdding && (
          <form
            onSubmit={handleCreateRule}
            className="bg-neutral-900/80 border border-indigo-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-indigo-500/10 backdrop-blur-md"
          >
            <div className="flex items-center gap-2 flex-1 w-full min-w-0">
              <input
                type="text"
                value={newProcessName}
                onChange={(e) => setNewProcessName(e.target.value)}
                placeholder="Nome do executável (ex: chrome.exe, code.exe)"
                autoFocus
                className="flex-1 h-9 px-3 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 font-mono"
              />

              <Select
                value={String(newTargetPageIndex)}
                onValueChange={(val) => setNewTargetPageIndex(parseInt(val, 10))}
              >
                <SelectTrigger className="w-40 h-9 bg-neutral-950 border-neutral-700 text-neutral-200 text-xs rounded-xl focus:ring-1 focus:ring-indigo-500">
                  <SelectValue placeholder="Página destino" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200 text-xs rounded-xl">
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
                className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Salvar</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAdding(false)}
                className="h-8 px-2 text-neutral-400 hover:text-neutral-200 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        )}

        {/* 2. Cabeçalho da Lista (cinza mutado com alinhamento) */}
        <div className="px-5 flex items-center justify-between text-xs font-medium text-neutral-400">
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
                  className="bg-neutral-900/50 hover:bg-neutral-900/80 border border-neutral-800/80 rounded-2xl px-5 py-4 flex items-center justify-between transition-colors shadow-sm backdrop-blur-sm group"
                >
                  {/* Esquerda: Ícone em círculo + nome do executável */}
                  <div className="w-1/3 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-neutral-800/90 border border-neutral-700/60 flex items-center justify-center text-neutral-300 flex-shrink-0 shadow-inner">
                      <IconComponent className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-sm font-mono text-neutral-200 truncate">
                      {rule.process_name}
                    </span>
                  </div>

                  {/* Centro: Seta roxa + Select de página de destino */}
                  <div className="w-1/3 flex items-center justify-center gap-3">
                    <ArrowRight className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <Select
                      value={String(rule.page_index)}
                      onValueChange={(val) =>
                        handleChangeTargetPage(rule.id, rule.process_name, val)
                      }
                    >
                      <SelectTrigger className="w-36 h-9 bg-neutral-950/80 border-neutral-800 text-neutral-200 text-xs rounded-xl focus:ring-1 focus:ring-indigo-500">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200 text-xs rounded-xl">
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
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-950/60 text-neutral-400 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <Switch
                      checked={true}
                      onCheckedChange={() => handleDeleteRule(rule.id)}
                      title="Desativar (remove a regra)"
                      className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-neutral-800 border-neutral-700"
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 border border-dashed border-neutral-800/80 rounded-2xl bg-neutral-900/20">
              <Laptop className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-xs text-neutral-400 font-medium">
                Nenhuma regra de perfil automático cadastrada.
              </p>
              <button
                type="button"
                onClick={handleToggleAdd}
                className="mt-2 text-xs text-indigo-400 hover:underline"
              >
                + Adicionar primeira regra
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Rodapé: Texto de Dica Centralizado */}
      <footer className="pt-12 pb-2 text-center">
        <p className="text-xs text-neutral-500 leading-relaxed max-w-lg mx-auto">
          Dica: Adicione regras para que o app mude de página automaticamente
          baseado no aplicativo focado.
        </p>
      </footer>
    </div>
  );
}

export default AutoProfileView;
