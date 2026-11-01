import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Contrast,
  Palette,
  LayoutGrid,
  Vibrate,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useDashboardStore } from "@/store/useDashboardStore";

const COLOR_OPTIONS = [
  { id: "purple", bg: "bg-indigo-600", label: "Roxo" },
  { id: "green", bg: "bg-emerald-500", label: "Verde" },
  { id: "red", bg: "bg-rose-500", label: "Vermelho" },
  { id: "yellow", bg: "bg-amber-400", label: "Amarelo" },
  { id: "blue", bg: "bg-sky-500", label: "Azul" },
  { id: "teal", bg: "bg-teal-600", label: "Turquesa" },
];

export function AppearanceView() {
  const theme = useDashboardStore((s) => s.theme);
  const setTheme = useDashboardStore((s) => s.setTheme);

  const normalizedTheme = (theme || "escuro").toLowerCase();
  const activeTheme =
    normalizedTheme === "claro" || normalizedTheme === "light"
      ? "claro"
      : normalizedTheme === "amoled"
      ? "amoled"
      : "escuro";

  const [selectedColor, setSelectedColor] = useState("purple");
  const [gridSize, setGridSize] = useState([3]);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [iconStyle, setIconStyle] = useState<"linha" | "preenchido">("linha");

  const handleThemeChange = async (novoTema: "escuro" | "claro" | "amoled") => {
    await setTheme(novoTema);
    try {
      await invoke("set_theme", { theme: novoTema });
    } catch (err) {
      console.warn("[AppearanceView] Erro ao sincronizar set_theme via IPC:", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-neutral-950/70 p-8 overflow-y-auto select-none justify-between">
      <div className="space-y-6 max-w-4xl">
        {/* Header: Título "Aparência" */}
        <header className="pb-2">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            Aparência
          </h1>
        </header>

        {/* Lista Vertical de Cards de Configurações */}
        <div className="space-y-3.5">
          {/* Card 1: Tema (Conectado ao Zustand e IPC set_theme) */}
          <div className="bg-neutral-900/50 hover:bg-neutral-900/70 border border-neutral-800/80 rounded-2xl px-6 py-4 flex items-center justify-between transition-colors shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-neutral-300">
                <Contrast className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-neutral-200">Tema</span>
            </div>

            <div className="flex items-center p-1 rounded-xl bg-neutral-950/80 border border-neutral-800">
              <button
                type="button"
                onClick={() => handleThemeChange("escuro")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTheme === "escuro"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Escuro
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("claro")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTheme === "claro"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Claro
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("amoled")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTheme === "amoled"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                AMOLED
              </button>
            </div>
          </div>

          {/* Card 2: Cor de destaque */}
          <div className="bg-neutral-900/50 hover:bg-neutral-900/70 border border-neutral-800/80 rounded-2xl px-6 py-4 flex items-center justify-between transition-colors shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-neutral-300">
                <Palette className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-neutral-200">Cor de destaque</span>
            </div>

            <div className="flex items-center gap-2.5">
              {COLOR_OPTIONS.map((col) => {
                const isSelected = selectedColor === col.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedColor(col.id)}
                    title={col.label}
                    className={`w-6 h-6 rounded-full ${col.bg} flex items-center justify-center transition-transform hover:scale-110 ${
                      isSelected ? "ring-2 ring-white/60 scale-105" : "opacity-90 hover:opacity-100"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 3: Tamanho da grade */}
          <div className="bg-neutral-900/50 hover:bg-neutral-900/70 border border-neutral-800/80 rounded-2xl px-6 py-4 flex items-center justify-between transition-colors shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-neutral-300">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-neutral-200">Tamanho da grade</span>
            </div>

            <div className="flex items-center gap-3 w-64">
              <span className="text-xs font-mono text-neutral-400">2</span>
              <Slider
                value={gridSize}
                onValueChange={setGridSize}
                min={2}
                max={6}
                step={1}
                className="[&_.relative]:bg-neutral-800 [&_[role=slider]]:bg-white [&_[role=slider]]:border-indigo-600 [&_.absolute]:bg-indigo-600"
              />
              <span className="text-xs font-mono text-neutral-400">6</span>
            </div>
          </div>

          {/* Card 4: Vibração ao tocar */}
          <div className="bg-neutral-900/50 hover:bg-neutral-900/70 border border-neutral-800/80 rounded-2xl px-6 py-4 flex items-center justify-between transition-colors shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-neutral-300">
                <Vibrate className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-neutral-200">Vibração ao tocar</span>
            </div>

            <Switch
              checked={vibrationEnabled}
              onCheckedChange={setVibrationEnabled}
              className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-neutral-800 border-neutral-700"
            />
          </div>

          {/* Card 5: Estilo de ícones */}
          <div className="bg-neutral-900/50 hover:bg-neutral-900/70 border border-neutral-800/80 rounded-2xl px-6 py-4 flex items-center justify-between transition-colors shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-neutral-300">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-neutral-200">Estilo de ícones</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIconStyle("linha")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  iconStyle === "linha"
                    ? "border-indigo-500/80 bg-indigo-950/30 text-indigo-300 shadow-sm"
                    : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {iconStyle === "linha" && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                <span>Linha</span>
              </button>

              <button
                type="button"
                onClick={() => setIconStyle("preenchido")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  iconStyle === "preenchido"
                    ? "border-indigo-500/80 bg-indigo-950/30 text-indigo-300 shadow-sm"
                    : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {iconStyle === "preenchido" && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                <span>Preenchido</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé: Dica Centralizada */}
      <footer className="pt-12 pb-2 text-center">
        <p className="text-xs text-neutral-500 leading-relaxed max-w-lg mx-auto">
          Dica: Personalize a interface do seu app para que ela se encaixe
          perfeitamente no seu fluxo de trabalho.
        </p>
      </footer>
    </div>
  );
}

export default AppearanceView;
