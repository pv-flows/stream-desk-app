import { Smartphone, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface MobilePreviewProps {
  activePage: string;
  previewOrientation: "portrait" | "landscape";
  onToggleOrientation: () => void;
}

const PREVIEW_BUTTONS = [
  { id: 1, label: "Calculadora" },
  { id: 2, label: "Navegador" },
  { id: 3, label: "Terminal" },
  { id: 4, label: "Gerenciador" },
  { id: 5, label: "Volume +" },
  { id: 6, label: "Play/Pause" },
];

export function MobilePreview({
  activePage,
  previewOrientation,
  onToggleOrientation,
}: MobilePreviewProps) {
  const isPortrait = previewOrientation === "portrait";

  return (
    <aside className="w-[320px] flex-shrink-0 flex flex-col border-l border-neutral-800/80 bg-neutral-900/95 backdrop-blur-md select-none">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-semibold text-neutral-200">
            Mobile Live Preview
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleOrientation}
          title="Girar Orientação da Maquete"
          className="h-7 w-7 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Mockup Display Wrapper */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
        {/* Smartphone Chassis - strictly using user specified class */}
        <div
          className={`transition-all duration-300 relative border-[12px] border-black rounded-[3rem] shadow-2xl overflow-hidden bg-neutral-950 p-2.5 flex flex-col justify-between ${
            isPortrait ? "w-[240px] h-[450px]" : "w-[290px] h-[210px]"
          }`}
        >
          {/* Dynamic Island / Notch */}
          <div className="self-center w-16 h-3.5 bg-black rounded-full mb-1 flex items-center justify-center gap-1.5 z-10">
            <span className="w-2 h-2 rounded-full bg-neutral-900 inline-block ring-1 ring-neutral-800" />
            <span className="w-1.5 h-1.5 rounded-full bg-sky-950 inline-block" />
          </div>

          {/* Simulated Phone Screen Content */}
          <div className="flex-1 rounded-[1.5rem] bg-gradient-to-br from-slate-900 via-neutral-900 to-sky-950/40 p-2.5 border border-neutral-800/60 flex flex-col justify-between overflow-hidden relative">
            {/* Mobile Screen Header */}
            <div className="flex items-center justify-between px-1 text-[9px] text-neutral-400 font-mono">
              <span className="truncate max-w-[90px] font-medium text-neutral-300">
                {activePage}
              </span>
              <div className="flex items-center gap-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>60 FPS</span>
              </div>
            </div>

            {/* Scaled Mini Grid */}
            <div
              className={`grid ${
                isPortrait ? "grid-cols-3" : "grid-cols-6"
              } gap-1.5 my-auto`}
            >
              {PREVIEW_BUTTONS.map((btn) => (
                <div
                  key={btn.id}
                  className="h-11 rounded-lg bg-neutral-800/80 border border-neutral-700/60 flex flex-col items-center justify-center text-center p-1 hover:border-sky-500/50 transition-colors shadow-sm"
                >
                  <span className="text-[8px] font-medium text-neutral-200 leading-tight truncate w-full px-0.5">
                    {btn.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Pager Dots Indicator */}
            <div className="flex items-center justify-center gap-1 py-0.5">
              <span className="h-1 w-3 rounded-full bg-sky-400" />
              <span className="h-1 w-1 rounded-full bg-neutral-600" />
              <span className="h-1 w-1 rounded-full bg-neutral-600" />
            </div>
          </div>

          {/* Home Indicator Bar */}
          <div className="self-center w-20 h-1 bg-neutral-600 rounded-full mt-1.5" />
        </div>

        <p className="mt-3 text-[10px] text-neutral-400 text-center font-mono">
          Simulação em escala real do cliente Expo
        </p>
      </div>

      {/* Preview Footer Specs */}
      <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/40 text-[11px] text-neutral-400 space-y-1.5">
        <div className="flex justify-between items-center">
          <span>Skin Ativa:</span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-neutral-700 bg-neutral-800/50 text-neutral-200"
          >
            Dark Premium (Glass)
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span>Orientação:</span>
          <span className="text-neutral-200 capitalize font-mono text-[10px]">
            {previewOrientation}
          </span>
        </div>
      </div>
    </aside>
  );
}

export default MobilePreview;
