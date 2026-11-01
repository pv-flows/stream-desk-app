import { useState } from "react";
import {
  Plus,
  ArrowRight,
  Globe,
  Music,
  Code,
  Play,
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

export interface MockRule {
  id: string;
  process: string;
  targetPage: string;
  enabled: boolean;
  icon: LucideIcon;
}

const INITIAL_RULES: MockRule[] = [
  {
    id: "1",
    process: "chrome.exe",
    targetPage: "Geral",
    enabled: true,
    icon: Globe,
  },
  {
    id: "2",
    process: "spotify.exe",
    targetPage: "Música",
    enabled: true,
    icon: Music,
  },
  {
    id: "3",
    process: "Code.exe",
    targetPage: "Código",
    enabled: false,
    icon: Code,
  },
  {
    id: "4",
    process: "youtube.exe",
    targetPage: "Geral",
    enabled: false,
    icon: Play,
  },
];

export function AutoProfileView() {
  const [rules, setRules] = useState<MockRule[]>(INITIAL_RULES);

  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleTargetPageChange = (id: string, newPage: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, targetPage: newPage } : r))
    );
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
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nova regra</span>
          </Button>
        </header>

        {/* 2. Cabeçalho da Lista (cinza mutado com alinhamento) */}
        <div className="px-5 flex items-center justify-between text-xs font-medium text-neutral-400">
          <span className="w-1/3">App / Processo</span>
          <span className="w-1/3 text-center">Destino</span>
          <span className="w-1/3 text-right">Status</span>
        </div>

        {/* 3. Linhas da Lista (Regras em Cards Horizontais Escuros) */}
        <div className="space-y-3">
          {rules.map((rule) => {
            const IconComponent = rule.icon;
            return (
              <div
                key={rule.id}
                className="bg-neutral-900/50 hover:bg-neutral-900/80 border border-neutral-800/80 rounded-2xl px-5 py-4 flex items-center justify-between transition-colors shadow-sm backdrop-blur-sm"
              >
                {/* Esquerda: Ícone em círculo + nome do executável */}
                <div className="w-1/3 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-neutral-800/90 border border-neutral-700/60 flex items-center justify-center text-neutral-300 flex-shrink-0 shadow-inner">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-mono text-neutral-200 truncate">
                    {rule.process}
                  </span>
                </div>

                {/* Centro: Seta roxa + Select de página de destino */}
                <div className="w-1/3 flex items-center justify-center gap-3">
                  <ArrowRight className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <Select
                    value={rule.targetPage}
                    onValueChange={(val) => handleTargetPageChange(rule.id, val)}
                  >
                    <SelectTrigger className="w-32 h-9 bg-neutral-950/80 border-neutral-800 text-neutral-200 text-xs rounded-xl focus:ring-1 focus:ring-indigo-500">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200 text-xs rounded-xl">
                      <SelectItem value="Geral">Geral</SelectItem>
                      <SelectItem value="Música">Música</SelectItem>
                      <SelectItem value="Código">Código</SelectItem>
                      <SelectItem value="Produtividade">Produtividade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Direita: Switch ligado/desligado (verde quando ativo) */}
                <div className="w-1/3 flex justify-end">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => handleToggleRule(rule.id)}
                    className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-neutral-800 border-neutral-700"
                  />
                </div>
              </div>
            );
          })}
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

