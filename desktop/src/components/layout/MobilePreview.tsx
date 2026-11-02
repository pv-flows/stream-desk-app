import { useState } from "react";
import {
  Smartphone,
  Mic,
  Play,
  Calculator,
  Zap,
  Terminal,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStore } from "@/store/useDashboardStore";
import {
  getLucideIcon,
  isBase64Icon,
  getBase64Src,
  resolveAccentColorHex,
  getAccentColor,
  getButtonRadiusClass,
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
  color?: string;
}

const DEFAULT_MOCKUP_BUTTONS: MockPhoneButton[] = [
  { id: 1, label: "Calculadora", icon: Calculator, color: "#f59e0b" },
  { id: 2, label: "Tarefas", icon: Zap, color: "#f97316" },
  { id: 3, label: "Terminal", icon: Terminal, color: "#64748b" },
  { id: 4, label: "Navegador", icon: ExternalLink, color: "#38bdf8" },
  { id: 5, label: "Play/Pause", icon: Play, color: "#22c55e" },
  { id: 6, label: "Mudo", icon: Mic, color: "#ef4444" },
];

/**
 * Ícone correspondente ao sistema operacional Android para rotação de tela (Screen Rotation / Auto-rotate).
 * Baseado na especificação oficial do Material Symbols do Android.
 */
function AndroidRotateIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M16.48 2.52c3.27 1.55 5.61 4.72 5.97 8.48h1.5C23.44 4.84 18.29 0 12 0l-.66.03 3.81 3.81 1.33-1.32zm-6.25-.77c-.59-.59-1.54-.59-2.12 0L1.75 8.11c-.59.59-.59 1.54 0 2.12l12.02 12.02c.59.59 1.54.59 2.12 0l6.36-6.36c.59-.59.59-1.54 0-2.12L10.23 1.75zm4.95 18.38L3.87 8.82l6.36-6.36 11.31 11.31-6.36 6.36zM7.52 21.48C4.25 19.94 1.91 16.76 1.55 13H.05C.56 19.16 5.71 24 12 24l.66-.03-3.81-3.81-1.33 1.32z" />
    </svg>
  );
}

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
  const appearance = useDashboardStore((s) => s.appearance);

  const normalizedTheme = (appearance?.theme || theme || "escuro").toLowerCase();
  const isLight = normalizedTheme === "claro" || normalizedTheme === "light";
  const isAmoled = normalizedTheme === "amoled";

  const activeAccentObj = getAccentColor(appearance);
  const defaultThemeAccent = activeAccentObj.hex;
  const buttonRadiusClass = getButtonRadiusClass(appearance?.button_radius);
  const showLabels = appearance?.show_labels ?? true;
  const glowEnabled = appearance?.glow_enabled ?? false;

  const activePageObject = pages.find((p) => p.id === activePageIndex);
  const pageTitle =
    controlledPage ?? (activePageObject ? activePageObject.name : "Principal");

  const pageButtons = buttons
    .filter((btn) => btn.page_index === activePageIndex)
    .sort((a, b) => a.position - b.position);

  // Estilos de fundo sincronizados com o app mobile
  const screenBgClass = isLight
    ? "bg-gradient-to-br from-slate-100 via-white to-indigo-50 text-slate-900"
    : isAmoled
    ? "bg-black text-white"
    : "bg-gradient-to-br from-neutral-900 via-neutral-950 to-indigo-950/40 text-white";

  const isFilled = appearance?.icon_style === "preenchido";
  const buttonDimension = Math.max(1, Math.min(10, appearance?.grid_columns || 5));
  const portraitCardHeight = Math.round(72 + (buttonDimension - 1) * 3);
  const landscapeCardHeight = Math.round(48 + (buttonDimension - 1) * 2.2);

  return (
    <aside
      className={`w-[320px] min-w-[320px] max-w-[320px] flex-shrink-0 flex flex-col border-l ${
        isLight
          ? "bg-white/95 border-slate-200 text-slate-800"
          : isAmoled
          ? "bg-black border-neutral-900 text-white"
          : "bg-neutral-900/95 border-neutral-800/80 text-white"
      } backdrop-blur-md select-none overflow-x-hidden transition-colors duration-200`}
    >
      {/* Header "Preview" */}
      <div
        className={`h-14 flex-shrink-0 px-4 border-b ${
          isLight ? "border-slate-200" : isAmoled ? "border-neutral-900" : "border-neutral-800/80"
        } flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          <Smartphone style={{ color: defaultThemeAccent }} className="w-4 h-4" />
          <h3 className={`text-sm font-medium ${isLight ? "text-slate-800" : "text-neutral-300"}`}>
            Preview
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className={`text-[9px] uppercase font-mono px-1.5 py-0 ${
              isLight ? "border-slate-300 text-slate-600" : "border-neutral-700 text-neutral-400"
            }`}
          >
            {normalizedTheme}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            title={
              isPortrait
                ? "Girar para Paisagem (Orientação Android)"
                : "Girar para Retrato (Orientação Android)"
            }
            className={`h-7 w-7 transition-colors ${
              isLight
                ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
            }`}
          >
            <AndroidRotateIcon className={`w-3.5 h-3.5 ${isLight ? "text-slate-700" : "text-neutral-300"}`} />
          </Button>
        </div>
      </div>

      {/* Mockup Display Wrapper (sem barra de rolagem visível e sem overflow horizontal) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar p-3 flex flex-col items-center">
        <div className="my-auto flex flex-col items-center flex-shrink-0">
          {/* Smartphone Chassis com transição reativa de tema */}
          <div
            className={`transition-all duration-300 relative border-[10px] border-white rounded-[2.8rem] shadow-2xl overflow-hidden p-2.5 flex flex-col justify-between flex-shrink-0 ${
              isLight ? "bg-slate-200" : "bg-black"
            } ${isPortrait ? "w-[240px] h-[480px]" : "w-[276px] h-[208px]"}`}
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
            className={`flex-1 rounded-[1.8rem] p-2.5 flex flex-col justify-between overflow-hidden relative transition-colors duration-300 ${screenBgClass}`}
          >
            {/* Grade flex adaptativa sincronizada com o app mobile:
                - Em pares (retrato) ou trios (paisagem)
                - Itens que não completam a linha são centralizados automaticamente (justify-center)
            */}
            <div
              className={`flex flex-wrap justify-center items-center ${
                isPortrait ? "gap-2.5" : "gap-2"
              } my-auto w-full`}
            >
              {pageButtons.length > 0
                ? pageButtons.slice(0, 6).map((btn) => {
                    const Icon = getLucideIcon(btn.icon);
                    const hasBase64 = isBase64Icon(btn.icon);
                    const accentColor = resolveAccentColorHex(btn.color, defaultThemeAccent);

                    const cardStyle: React.CSSProperties = isLight
                      ? {
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                          borderColor: `${accentColor}55`,
                          boxShadow: glowEnabled
                            ? `0 0 12px ${accentColor}40`
                            : `0 2px 8px ${accentColor}18`,
                        }
                      : isAmoled
                      ? {
                          backgroundColor: "rgba(14, 14, 16, 0.95)",
                          borderColor: `${accentColor}44`,
                          boxShadow: glowEnabled
                            ? `0 0 14px ${accentColor}45`
                            : `0 4px 14px ${accentColor}25`,
                        }
                      : {
                          backgroundColor: "rgba(24, 24, 28, 0.85)",
                          borderColor: `${accentColor}44`,
                          boxShadow: glowEnabled
                            ? `0 0 14px ${accentColor}45`
                            : `0 4px 14px ${accentColor}25`,
                        };

                    return (
                      <div
                        key={btn.id}
                        onClick={() =>
                          toast({
                            title: `Simulador: ${btn.label}`,
                            description: `Comando: ${btn.action_name}`,
                          })
                        }
                        style={{
                          ...cardStyle,
                          height: isPortrait ? `${portraitCardHeight}px` : `${landscapeCardHeight}px`,
                        }}
                        className={`border flex flex-col items-center justify-center text-center p-1 transition-all cursor-pointer hover:scale-105 active:scale-95 flex-shrink-0 ${buttonRadiusClass} ${
                          isPortrait
                            ? "w-[calc(50%-6px)]"
                            : "w-[calc(33.333%-6px)]"
                        }`}
                      >
                        {hasBase64 ? (
                          <img
                            src={getBase64Src(btn.icon)}
                            alt=""
                            className={`${
                              isPortrait ? "w-6 h-6 mb-1.5" : "w-4 h-4 mb-1"
                            } object-contain rounded`}
                          />
                        ) : (
                          <Icon
                            style={{ color: accentColor }}
                            fill={isFilled ? "currentColor" : "none"}
                            strokeWidth={isFilled ? 2.5 : 2}
                            className={`${
                              isPortrait ? "w-6 h-6 mb-1.5" : "w-4 h-4 mb-1"
                            } transition-transform`}
                          />
                        )}
                        {showLabels && (
                          <span
                            className={`font-medium leading-tight truncate w-full px-1 ${
                              isPortrait ? "text-[8.5px]" : "text-[7.5px]"
                            } ${isLight ? "text-slate-700" : "text-neutral-200"}`}
                          >
                            {btn.label}
                          </span>
                        )}
                      </div>
                    );
                  })
                : DEFAULT_MOCKUP_BUTTONS.slice(0, 6).map((item) => {
                    const IconComp = item.icon;
                    const accentColor = resolveAccentColorHex(item.color, defaultThemeAccent);

                    const cardStyle: React.CSSProperties = isLight
                      ? {
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                          borderColor: `${accentColor}55`,
                          boxShadow: glowEnabled
                            ? `0 0 12px ${accentColor}40`
                            : `0 2px 8px ${accentColor}18`,
                        }
                      : isAmoled
                      ? {
                          backgroundColor: "rgba(14, 14, 16, 0.95)",
                          borderColor: `${accentColor}44`,
                          boxShadow: glowEnabled
                            ? `0 0 14px ${accentColor}45`
                            : `0 4px 14px ${accentColor}25`,
                        }
                      : {
                          backgroundColor: "rgba(24, 24, 28, 0.85)",
                          borderColor: `${accentColor}44`,
                          boxShadow: glowEnabled
                            ? `0 0 14px ${accentColor}45`
                            : `0 4px 14px ${accentColor}25`,
                        };

                    return (
                      <div
                        key={item.id}
                        onClick={() =>
                          toast({
                            title: `Simulador: ${item.label}`,
                            description: "Ação de demonstração no preview mobile.",
                          })
                        }
                        style={{
                          ...cardStyle,
                          height: isPortrait ? `${portraitCardHeight}px` : `${landscapeCardHeight}px`,
                        }}
                        className={`border flex flex-col items-center justify-center text-center p-1 transition-all cursor-pointer hover:scale-105 active:scale-95 flex-shrink-0 ${buttonRadiusClass} ${
                          isPortrait
                            ? "w-[calc(50%-6px)]"
                            : "w-[calc(33.333%-6px)]"
                        }`}
                      >
                        <IconComp
                          style={{ color: accentColor }}
                          fill={isFilled ? "currentColor" : "none"}
                          strokeWidth={isFilled ? 2.5 : 2}
                          className={`${
                            isPortrait ? "w-6 h-6 mb-1.5" : "w-4 h-4 mb-1"
                          } transition-transform`}
                        />
                        {showLabels && (
                          <span
                            className={`font-medium leading-tight truncate w-full px-1 ${
                              isPortrait ? "text-[8.5px]" : "text-[7.5px]"
                            } ${isLight ? "text-slate-700" : "text-neutral-200"}`}
                          >
                            {item.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
            </div>
          </div>

          {/* Home Indicator Bar */}
          <div
            className={`self-center w-20 h-1 rounded-full mt-1 ${
              isLight ? "bg-slate-400" : "bg-neutral-700"
            }`}
          />
        </div>

          <p className="mt-2.5 text-[10px] text-neutral-500 text-center font-mono flex-shrink-0">
            {pageTitle} • Tema: {normalizedTheme.toUpperCase()}
          </p>
        </div>
      </div>
    </aside>
  );
}

export default MobilePreview;
