import { useState } from "react";
import {
  Smartphone,
  RotateCw,
  Mic,
  Camera,
  Lock,
  Play,
  SkipForward,
  Rewind,
  Volume2,
  Volume1,
  Sun,
  Sparkles,
  Info,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStore } from "@/store/useDashboardStore";
import {
  getLucideIcon,
  getButtonColorStyles,
  isBase64Icon,
  getBase64Src,
} from "@/lib/buttonUtils";

export interface MobilePreviewProps {
  activePage?: string;
  previewOrientation?: "portrait" | "landscape";
  onToggleOrientation?: () => void;
}

interface MockPhoneButton {
  id: number;
  label: string;
  icon: LucideIcon;
  highlighted?: boolean;
}

const DEFAULT_MOCKUP_BUTTONS: MockPhoneButton[] = [
  { id: 1, label: "Mudo", icon: Mic, highlighted: true },
  { id: 2, label: "Câmera", icon: Camera },
  { id: 3, label: "Trancar", icon: Lock },
  { id: 4, label: "Câmera", icon: Camera },
  { id: 5, label: "Tocar/Pausar", icon: Play },
  { id: 6, label: "Próximo", icon: SkipForward },
  { id: 7, label: "Volume", icon: Rewind },
  { id: 8, label: "Volume", icon: Volume2 },
  { id: 9, label: "Vol +", icon: Volume1 },
  { id: 10, label: "Próximo", icon: Rewind },
  { id: 11, label: "Próximo", icon: Volume1 },
  { id: 12, label: "Brilho", icon: Sun },
  { id: 13, label: "Brilho", icon: Sun },
  { id: 14, label: "Sobre", icon: Sparkles },
  { id: 15, label: "Sobre", icon: Info },
];

export function MobilePreview({
  activePage: controlledPage,
  previewOrientation: controlledOrientation,
  onToggleOrientation,
}: MobilePreviewProps = {}) {
  const [internalOrientation, setInternalOrientation] = useState<
    "portrait" | "landscape"
  >("portrait");
  const orientation = controlledOrientation ?? internalOrientation;
  const { toast } = useToast();

  const handleToggle = () => {
    if (onToggleOrientation) {
      onToggleOrientation();
    } else {
      setInternalOrientation((prev) =>
        prev === "portrait" ? "landscape" : "portrait"
      );
    }
  };

  const isPortrait = orientation === "portrait";

  const buttons = useDashboardStore((s) => s.buttons);
  const pages = useDashboardStore((s) => s.pages);
  const activePageIndex = useDashboardStore((s) => s.activePageIndex);
  const theme = useDashboardStore((s) => s.theme);

  const normalizedTheme = (theme || "escuro").toLowerCase();
  const isLight = normalizedTheme === "claro" || normalizedTheme === "light";
  const isAmoled = normalizedTheme === "amoled";

  const activePageObject = pages.find((p) => p.id === activePageIndex);
  const pageTitle =
    controlledPage ?? (activePageObject ? activePageObject.name : "Principal");

  const pageButtons = buttons
    .filter((btn) => btn.page_index === activePageIndex)
    .sort((a, b) => a.position - b.position);

  // Estilos dinâmicos da tela do celular baseados no tema do Zustand
  const screenBgClass = isLight
    ? "bg-gradient-to-br from-slate-100 via-white to-indigo-50 text-slate-900"
    : isAmoled
    ? "bg-black text-white"
    : "bg-gradient-to-br from-neutral-900 via-neutral-950 to-indigo-950/40 text-white";

  const defaultCardClass = isLight
    ? "bg-white border-slate-200/90 text-slate-800 shadow-sm"
    : isAmoled
    ? "bg-black border-neutral-800 text-neutral-100"
    : "bg-neutral-900/90 border-neutral-800/90 text-neutral-200";

  return (
    <aside className="w-[320px] flex-shrink-0 flex flex-col border-l border-neutral-800/80 bg-neutral-900/95 backdrop-blur-md select-none">
      {/* Header "Preview" */}
      <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-medium text-neutral-300">Preview</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="text-[9px] uppercase font-mono px-1.5 py-0 border-neutral-700 text-neutral-400"
          >
            {normalizedTheme}
          </Badge>
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
      </div>

      {/* Mockup Display Wrapper */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
        {/* Smartphone Chassis com transição reativa de tema */}
        <div
          className={`transition-all duration-300 relative border-[10px] border-white rounded-[2.8rem] shadow-2xl overflow-hidden p-2.5 flex flex-col justify-between ${
            isLight ? "bg-slate-200" : "bg-black"
          } ${isPortrait ? "w-[240px] h-[480px]" : "w-[300px] h-[220px]"}`}
        >
          {/* Status Bar + Notch */}
          <div className="w-full flex items-center justify-between px-3 pt-0.5 pb-1 z-10">
            <span
              className={`text-[8px] font-semibold ${
                isLight ? "text-slate-800" : "text-white"
              }`}
            >
              9:41
            </span>
            <div className="w-20 h-3.5 bg-black rounded-full flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-800 inline-block" />
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`w-2.5 h-1.5 rounded-xs inline-block ${
                  isLight ? "bg-slate-800" : "bg-white"
                }`}
              />
            </div>
          </div>

          {/* Simulated Phone Screen Content */}
          <div
            className={`flex-1 rounded-[1.8rem] p-2 flex flex-col justify-between overflow-hidden relative transition-colors duration-300 ${screenBgClass}`}
          >
            <div
              className={`grid ${
                isPortrait ? "grid-cols-3" : "grid-cols-5"
              } gap-2 my-auto`}
            >
              {pageButtons.length > 0
                ? pageButtons.slice(0, 15).map((btn, idx) => {
                    const Icon = getLucideIcon(btn.icon);
                    const colorStyle = getButtonColorStyles(btn.color);
                    const hasBase64 = isBase64Icon(btn.icon);
                    const isFirst = idx === 0;

                    return (
                      <div
                        key={btn.id}
                        onClick={() =>
                          toast({
                            title: `Simulador: ${btn.label}`,
                            description: `Comando: ${btn.action_name}`,
                          })
                        }
                        style={!isFirst && !isLight ? colorStyle.style : undefined}
                        className={`h-16 rounded-xl border flex flex-col items-center justify-center text-center p-1 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95 ${
                          isFirst
                            ? "bg-indigo-600 border-indigo-400 text-white shadow-indigo-600/30"
                            : isLight
                            ? defaultCardClass
                            : `${defaultCardClass} ${colorStyle.className}`
                        }`}
                      >
                        {hasBase64 ? (
                          <img
                            src={getBase64Src(btn.icon)}
                            alt=""
                            className="w-4 h-4 object-contain rounded mb-1"
                          />
                        ) : (
                          <Icon
                            className={`w-4 h-4 mb-1 ${
                              isFirst
                                ? "text-white"
                                : isLight
                                ? "text-indigo-600"
                                : "text-neutral-200"
                            }`}
                          />
                        )}
                        <span
                          className={`text-[7.5px] font-medium leading-tight truncate w-full px-0.5 ${
                            isFirst
                              ? "text-white"
                              : isLight
                              ? "text-slate-700"
                              : "text-neutral-300"
                          }`}
                        >
                          {btn.label}
                        </span>
                      </div>
                    );
                  })
                : DEFAULT_MOCKUP_BUTTONS.slice(0, isPortrait ? 15 : 10).map(
                    (item) => {
                      const IconComp = item.icon;
                      return (
                        <div
                          key={item.id}
                          onClick={() =>
                            toast({
                              title: `Simulador: ${item.label}`,
                              description: "Ação de demonstração no preview mobile.",
                            })
                          }
                          className={`h-16 rounded-xl border flex flex-col items-center justify-center text-center p-1 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95 ${
                            item.highlighted
                              ? "bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/40"
                              : defaultCardClass
                          }`}
                        >
                          <IconComp
                            className={`w-4 h-4 mb-1 ${
                              item.highlighted
                                ? "text-white"
                                : isLight
                                ? "text-slate-700"
                                : "text-neutral-200"
                            }`}
                          />
                          <span
                            className={`text-[7.5px] font-medium leading-tight truncate w-full px-0.5 ${
                              item.highlighted
                                ? "text-white"
                                : isLight
                                ? "text-slate-600"
                                : "text-neutral-400"
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                      );
                    }
                  )}
            </div>
          </div>

          {/* Home Indicator Bar */}
          <div
            className={`self-center w-20 h-1 rounded-full mt-1 ${
              isLight ? "bg-slate-400" : "bg-neutral-700"
            }`}
          />
        </div>

        <p className="mt-2.5 text-[10px] text-neutral-500 text-center font-mono">
          {pageTitle} • Tema: {normalizedTheme.toUpperCase()}
        </p>
      </div>
    </aside>
  );
}

export default MobilePreview;
