import { useState } from "react";
import {
  Mic,
  Palette,
  Search,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ACTION_TYPES = [
  { id: "atalho", label: "Atalho" },
  { id: "app", label: "App" },
  { id: "url", label: "URL" },
  { id: "webhook", label: "Webhook" },
  { id: "cena", label: "Cena" },
  { id: "luz", label: "Luz" },
] as const;

export function ButtonEditorView() {
  const [selectedType, setSelectedType] = useState<string>("atalho");
  const [name, setName] = useState("Atalho de Mudo");
  const [iconQuery, setIconQuery] = useState("");
  const [hotkey, setHotkey] = useState("Ctrl+Opt+M");
  const [systemShortcut, setSystemShortcut] = useState("");
  const [longPress, setLongPress] = useState(false);
  const [focusIfOpen, setFocusIfOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-neutral-950/70 p-8 overflow-y-auto select-none justify-between">
      <div className="space-y-6 max-w-4xl">
        {/* 1. Cabeçalho Dividido: Esquerda (Ícone + Paleta) | Direita (Inputs Nome e Ícone) */}
        <div className="flex items-stretch gap-5">
          {/* Bloco Esquerdo: Ícone Principal + Coluna de Paleta/Cor */}
          <div className="flex items-center gap-3.5 flex-shrink-0">
            {/* Quadrado Grande do Ícone Principal */}
            <div className="w-36 h-36 rounded-2xl bg-neutral-900/70 border border-neutral-800/90 flex items-center justify-center shadow-lg">
              <Mic className="w-14 h-14 text-neutral-100 stroke-[1.75]" />
            </div>

            {/* Coluna com 2 Quadrados Menores: Paleta de Cor e Amostra de Fundo */}
            <div className="flex flex-col justify-between h-36 gap-3">
              <button
                type="button"
                title="Paleta de Cor"
                className="w-16 flex-1 rounded-2xl bg-neutral-900/70 hover:bg-neutral-800/80 border border-neutral-800/90 flex items-center justify-center text-neutral-300 transition-colors shadow-sm"
              >
                <Palette className="w-6 h-6" />
              </button>

              <button
                type="button"
                title="Cor do Fundo"
                className="w-16 flex-1 rounded-2xl bg-neutral-900/70 hover:bg-neutral-800/80 border border-neutral-800/90 flex items-center justify-center p-3 transition-colors shadow-sm"
              >
                <div
                  className="w-full h-full rounded-lg border border-neutral-700/60 overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #171717 50%, #262626 50%)",
                  }}
                />
              </button>
            </div>
          </div>

          {/* Bloco Direito: Inputs de "Nome" e Busca de "Ícone" */}
          <div className="flex-1 flex flex-col justify-between py-0.5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Nome
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do botão"
                className="h-11 rounded-xl bg-neutral-900/70 border-indigo-500/60 text-neutral-100 text-sm px-4 focus-visible:ring-1 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Ícone
              </label>
              <div className="relative">
                <Input
                  value={iconQuery}
                  onChange={(e) => setIconQuery(e.target.value)}
                  placeholder="Buscar ícone..."
                  className="h-11 rounded-xl bg-neutral-900/70 border-neutral-800/90 text-neutral-200 text-sm pl-4 pr-10 focus-visible:ring-1 focus-visible:ring-indigo-500"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Seção "Tipo": Grupo de Botões Horizontais */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-300">Tipo</label>
          <div className="bg-neutral-900/60 border border-neutral-800/90 rounded-xl p-1 grid grid-cols-6 items-center">
            {ACTION_TYPES.map((type, idx) => {
              const isActive = selectedType === type.id;
              return (
                <div key={type.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    {type.label}
                  </button>
                  {idx < ACTION_TYPES.length - 1 && !isActive && (
                    <span className="h-4 w-[1px] bg-neutral-800/80 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Campos Específicos: Atalho de Teclado e Atalho de Sistema */}
        <Card className="bg-neutral-900/50 border-neutral-800/80 rounded-2xl p-5 shadow-sm backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">
                Atalho de Teclado
              </label>
              <Input
                value={hotkey}
                onChange={(e) => setHotkey(e.target.value)}
                placeholder="Ex: Ctrl+Opt+M"
                className="h-11 rounded-xl bg-neutral-950/60 border-neutral-800 text-neutral-100 text-xs font-mono px-4 focus-visible:ring-1 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">
                Atalho de Sistema
              </label>
              <Select value={systemShortcut} onValueChange={setSystemShortcut}>
                <SelectTrigger className="h-11 rounded-xl bg-neutral-950/60 border-neutral-800 text-neutral-200 text-xs px-4 focus:ring-1 focus:ring-indigo-500">
                  <SelectValue placeholder="Selecione uma ação..." />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200 text-xs rounded-xl">
                  <SelectItem value="mute">Alternar Mudo (Microfone)</SelectItem>
                  <SelectItem value="vol_up">Aumentar Volume</SelectItem>
                  <SelectItem value="vol_down">Diminuir Volume</SelectItem>
                  <SelectItem value="play_pause">Reproduzir / Pausar Mídia</SelectItem>
                  <SelectItem value="lock">Bloquear Estação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* 4. Seção "Avançado" em Card Escuro */}
        <Card className="bg-neutral-900/50 border-neutral-800/80 rounded-2xl p-5 space-y-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-200">
              Avançado
            </span>
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </div>

          <div className="space-y-3.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-300">
                Toque longo
              </span>
              <Switch
                checked={longPress}
                onCheckedChange={setLongPress}
                className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-neutral-700 border-neutral-700"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-300">
                Focar se já estiver aberto.
              </span>
              <Switch
                checked={focusIfOpen}
                onCheckedChange={setFocusIfOpen}
                className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-neutral-700 border-neutral-700"
              />
            </div>
          </div>
        </Card>

        {/* 5. Rodapé com Botões "Cancelar" e "Salvar" alinhados à direita */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 px-6 rounded-xl border-neutral-800 bg-neutral-900/70 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="h-10 px-7 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition-all"
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ButtonEditorView;
