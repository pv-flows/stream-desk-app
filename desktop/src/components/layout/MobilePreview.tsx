import { useState } from "react";
import { Smartphone, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardStore } from "@/store/useDashboardStore";
import { getLucideIcon, getButtonColorStyles, isBase64Icon, getBase64Src } from "@/lib/buttonUtils";

export interface MobilePreviewProps {
  activePage?: string;
  previewOrientation?: "portrait" | "landscape";
  onToggleOrientation?: () => void;
}

export function MobilePreview({
  activePage: controlledPage,
  previewOrientation: controlledOrientation,
  onToggleOrientation,
}: MobilePreviewProps = {}) {
  const [internalOrientation, setInternalOrientation] = useState<"portrait" | "landscape">("portrait");
  const orientation = controlledOrientation ?? internalOrientation;

  const handleToggle = () => {
    if (onToggleOrientation) {
      onToggleOrientation();
    } else {
      setInternalOrientation((prev) => (prev === "portrait" ? "landscape" : "portrait"));
    }
  };

  const isPortrait = orientation === "portrait";

  const buttons = useDashboardStore((s) => s.buttons);
  const pages = useDashboardStore((s) => s.pages);
  const activePageIndex = useDashboardStore((s) => s.activePageIndex);

  const activePageObject = pages.find((p) => p.id === activePageIndex);
  const pageTitle = controlledPage ?? (activePageObject ? activePageObject.name : "Principal");

  // Filtra estritamente os botões da página ativa
  const pageButtons = buttons.filter((btn) => btn.page_index === activePageIndex);

  return (
    <aside className="w-[320px] flex-shrink-0 flex flex-col border-l border-neutral-800/80 bg-neutral-900/95 backdrop-blur-md select-none">
      {/* Header "Preview" (conforme Mockup) */}
      <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-medium text-neutral-300">
            Preview
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          title="Girar Orientação da Maquete"
          className="h-7 w-7 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Mockup Display Wrapper */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
        {/* Smartphone Chassis estilizado com borda branca (conforme Mockup) */}
        <div
          className={`transition-all duration-300 relative border-[10px] border-white rounded-[2.8rem] shadow-2xl overflow-hidden bg-black p-2.5 flex flex-col justify-between ${
            isPortrait ? "w-[240px] h-[460px]" : "w-[300px] h-[210px]"
          }`}
        >
          {/* Dynamic Island / Notch do Mockup */}
          <div className="self-center w-20 h-4 bg-black rounded-full mb-1 flex items-center justify-between px-2 z-10">
            <span className="text-[7px] text-neutral-400 font-mono">9:41</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-800 inline-block" />
              <span className="w-2.5 h-1.5 rounded-sm bg-neutral-700 inline-block" />
            </div>
          </div>

          {/* Simulated Phone Screen Content */}
          <div className="flex-1 rounded-[1.8rem] bg-neutral-950 p-2.5 flex flex-col justify-between overflow-hidden relative">
            {/* Scaled Mini Grid com Botões Reais */}
            <div
              className={`grid ${
                isPortrait ? "grid-cols-3" : "grid-cols-6"
              } gap-1.5 my-auto`}
            >
              {pageButtons.length > 0 ? (
                pageButtons.map((btn) => {
                  const Icon = getLucideIcon(btn.icon);
                  const colorStyle = getButtonColorStyles(btn.color);
                  const hasBase64 = isBase64Icon(btn.icon);

                  return (
                    <div
                      key={btn.id}
                      style={colorStyle.style}
                      className={`h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center text-center p-1 hover:border-indigo-500/50 transition-colors shadow-sm ${colorStyle.className}`}
                    >
                      {hasBase64 ? (
                        <img
                          src={getBase64Src(btn.icon)}
                          alt=""
                          className="w-3.5 h-3.5 object-contain rounded mb-0.5"
                        />
                      ) : (
                        <Icon className="w-3.5 h-3.5 text-neutral-300 mb-0.5" />
                      )}
                      <span className="text-[7px] font-medium text-neutral-300 leading-tight truncate w-full px-0.5">
                        {btn.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 text-center py-6">
                  <span className="text-[9px] text-neutral-600 font-mono">
                    Sem botões ativos
                  </span>
                </div>
              )}
            </div>

            {/* Pager Dots Indicator */}
            <div className="flex items-center justify-center gap-1 py-1">
              {pages.map((p) => (
                <span
                  key={p.id}
                  className={`h-1 rounded-full transition-all ${
                    p.id === activePageIndex
                      ? "w-3 bg-indigo-500"
                      : "w-1 bg-neutral-700"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Home Indicator Bar */}
          <div className="self-center w-20 h-1 bg-neutral-700 rounded-full mt-1" />
        </div>

        <p className="mt-3 text-[10px] text-neutral-500 text-center font-mono">
          {pageTitle} (320px)
        </p>
      </div>
    </aside>
  );
}

export default MobilePreview;
