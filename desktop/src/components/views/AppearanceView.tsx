import { useState, useEffect, useRef } from "react";
import {
  Contrast,
  Palette,
  LayoutGrid,
  Vibrate,
  SlidersHorizontal,
  Check,
  Play,
  Sparkles,
  RotateCcw,
  Monitor,
  Moon,
  Sun,
  Flame,
  Type,
  Square,
  Pipette,
  Calculator,
  MicOff,
  Paintbrush,
  Undo2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStore } from "@/store/useDashboardStore";
import {
  getAccentColor,
  ACCENT_OPTIONS,
  type AccentOption,
  BG_PRESETS,
  type BgPreset,
  getButtonRadiusClass,
  getLabelFontSizeClass,
  isHexColorLight,
} from "@/lib/buttonUtils";

export function AppearanceView() {
  const { toast } = useToast();
  const theme = useDashboardStore((s) => s.theme);
  const appearance = useDashboardStore((s) => s.appearance);
  const setAppearance = useDashboardStore((s) => s.setAppearance);

  const rawTheme = (appearance?.theme || theme || "escuro").toLowerCase();

  // Resolução de tema ativo (se for sistema, checa media query)
  const systemPrefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const resolvedTheme =
    rawTheme === "sistema" || rawTheme === "auto"
      ? systemPrefersDark
        ? "escuro"
        : "claro"
      : rawTheme;

  const customBgHex = appearance?.custom_bg_hex || null;
  const isCustomBg = Boolean(customBgHex);
  const isCustomBgLight = isCustomBg ? isHexColorLight(customBgHex) : false;

  const isLight = isCustomBg ? isCustomBgLight : (resolvedTheme === "claro" || resolvedTheme === "light");
  const isAmoled = !isCustomBg && resolvedTheme === "amoled";

  const accent = getAccentColor(appearance);
  const [sliderValue, setSliderValue] = useState<number[]>([appearance?.grid_columns || 5]);

  // Estados locais para inputs hex
  const [customHexInput, setCustomHexInput] = useState(
    appearance?.custom_accent_hex || (accent.id === "custom" ? accent.hex : "#6366f1")
  );
  const [customBgInput, setCustomBgInput] = useState(customBgHex || "#0a0a0c");

  // Timers de debounce para evitar flood de persistência e pop-ups durante o arrasto
  const accentDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const vibrationEnabled = appearance?.vibration_enabled ?? true;
  const iconStyle = appearance?.icon_style === "preenchido" ? "preenchido" : "linha";
  const buttonRadius = appearance?.button_radius || "smooth";
  const showLabels = appearance?.show_labels ?? true;
  const labelFontSize = appearance?.label_font_size || "normal";
  const hapticStrength = appearance?.haptic_strength || "medium";
  const glowEnabled = appearance?.glow_enabled ?? false;

  useEffect(() => {
    if (appearance?.grid_columns) {
      setSliderValue([appearance.grid_columns]);
    }
  }, [appearance?.grid_columns]);

  useEffect(() => {
    if (appearance?.custom_accent_hex) {
      setCustomHexInput(appearance.custom_accent_hex);
    }
  }, [appearance?.custom_accent_hex]);

  useEffect(() => {
    if (appearance?.custom_bg_hex) {
      setCustomBgInput(appearance.custom_bg_hex);
    }
  }, [appearance?.custom_bg_hex]);

  // Limpa timers ao desmontar
  useEffect(() => {
    return () => {
      if (accentDebounceTimer.current) clearTimeout(accentDebounceTimer.current);
      if (bgDebounceTimer.current) clearTimeout(bgDebounceTimer.current);
    };
  }, []);

  const handleThemeChange = async (novoTema: "sistema" | "escuro" | "claro" | "amoled") => {
    try {
      await setAppearance({ theme: novoTema });
      toast({
        title: "Tema Atualizado",
        description: `Modo "${novoTema.toUpperCase()}" aplicado com sucesso.`,
      });
    } catch (err) {
      console.warn("[AppearanceView] Erro ao sincronizar tema:", err);
    }
  };

  // 1. Cor de Destaque Pré-definida
  const handleSelectColor = async (col: AccentOption) => {
    try {
      await setAppearance({ accent_color: col.id });
      toast({
        title: "Cor de Destaque",
        description: `Paleta "${col.label}" aplicada à interface.`,
      });
    } catch (err) {
      console.warn("[AppearanceView] Erro ao sincronizar cor:", err);
    }
  };

  // 2. Cor de Destaque no Arrasto do Seletor (Color Picker) - Sem flood de toasts
  const handleAccentPickerDrag = (newHex: string) => {
    setCustomHexInput(newHex);
    // Aplicação imediata no DOM CSS para zero latência
    document.documentElement.style.setProperty("--accent-primary", newHex);

    if (accentDebounceTimer.current) {
      clearTimeout(accentDebounceTimer.current);
    }
    accentDebounceTimer.current = setTimeout(async () => {
      try {
        await setAppearance({
          accent_color: "custom",
          custom_accent_hex: newHex,
        });
      } catch (err) {
        console.warn("[AppearanceView] Erro ao salvar cor personalizada silenciosamente:", err);
      }
    }, 300);
  };

  // 3. Aplicação explícita da Cor de Destaque Customizada (Dispara 1 único toast)
  const handleApplyCustomHex = async (hex: string) => {
    const formatted = hex.startsWith("#") ? hex : `#${hex}`;
    if (!/^#[0-9A-Fa-f]{6}$/.test(formatted)) {
      toast({
        title: "Cor Inválida",
        description: "Insira uma cor hexadecimal válida com 6 dígitos (ex: #6366f1).",
        variant: "destructive",
      });
      return;
    }
    if (accentDebounceTimer.current) {
      clearTimeout(accentDebounceTimer.current);
    }
    try {
      await setAppearance({
        accent_color: "custom",
        custom_accent_hex: formatted,
      });
      setCustomHexInput(formatted);
      toast({
        title: "Cor de Destaque Personalizada",
        description: `Cor ${formatted.toUpperCase()} aplicada à interface.`,
      });
    } catch (err) {
      console.warn("[AppearanceView] Erro ao salvar cor personalizada:", err);
    }
  };

  // 4. Cor de Fundo Pré-definida
  const handleSelectBgPreset = async (preset: BgPreset) => {
    if (bgDebounceTimer.current) clearTimeout(bgDebounceTimer.current);
    try {
      await setAppearance({ custom_bg_hex: preset.hex });
      setCustomBgInput(preset.hex);
      toast({
        title: "Cor de Fundo",
        description: `Fundo "${preset.label}" (${preset.hex}) aplicado com sucesso.`,
      });
    } catch (err) {
      console.warn("[AppearanceView] Erro ao salvar cor de fundo:", err);
    }
  };

  // 5. Cor de Fundo no Arrasto do Seletor - Sem flood de toasts
  const handleBgPickerDrag = (newHex: string) => {
    setCustomBgInput(newHex);
    document.documentElement.style.setProperty("--app-bg-custom", newHex);

    if (bgDebounceTimer.current) {
      clearTimeout(bgDebounceTimer.current);
    }
    bgDebounceTimer.current = setTimeout(async () => {
      try {
        await setAppearance({ custom_bg_hex: newHex });
      } catch (err) {
        console.warn("[AppearanceView] Erro ao salvar fundo silenciosamente:", err);
      }
    }, 300);
  };

  // 6. Aplicação explícita do Fundo Customizado (Dispara 1 único toast)
  const handleApplyCustomBg = async (hex: string) => {
    const formatted = hex.startsWith("#") ? hex : `#${hex}`;
    if (!/^#[0-9A-Fa-f]{6}$/.test(formatted)) {
      toast({
        title: "Cor de Fundo Inválida",
        description: "Insira um código hexadecimal válido de 6 dígitos (ex: #121214).",
        variant: "destructive",
      });
      return;
    }
    if (bgDebounceTimer.current) {
      clearTimeout(bgDebounceTimer.current);
    }
    try {
      await setAppearance({ custom_bg_hex: formatted });
      setCustomBgInput(formatted);
      toast({
        title: "Cor de Fundo Atualizada",
        description: `Fundo ${formatted.toUpperCase()} aplicado ao aplicativo.`,
      });
    } catch (err) {
      console.warn("[AppearanceView] Erro ao salvar cor de fundo:", err);
    }
  };

  // 7. Restaurar Fundo Padrão do Tema
  const handleResetBgToTheme = async () => {
    if (bgDebounceTimer.current) clearTimeout(bgDebounceTimer.current);
    try {
      await setAppearance({ custom_bg_hex: null });
      toast({
        title: "Fundo Restaurado",
        description: "A interface voltou ao fundo original correspondente ao tema.",
      });
    } catch (err) {
      console.warn("[AppearanceView] Erro ao restaurar fundo:", err);
    }
  };

  const handleButtonDimensionCommit = async (val: number[]) => {
    try {
      await setAppearance({ grid_columns: val[0] });
      toast({
        title: "Tamanho dos Botões",
        description: `Dimensão ajustada para nível ${val[0]} (1 a 10).`,
      });
    } catch (err) {
      console.warn("[AppearanceView] Erro ao sincronizar dimensão dos botões:", err);
    }
  };

  const handleToggleVibration = async (checked: boolean) => {
    try {
      await setAppearance({ vibration_enabled: checked });
      toast({
        title: "Vibração ao Tocar",
        description: checked
          ? "Feedback háptico habilitado no aplicativo mobile."
          : "Vibração ao pressionar desabilitada.",
      });
    } catch (err) {
      console.warn("[AppearanceView] Erro ao alternar vibração:", err);
    }
  };

  const handleHapticStrengthChange = async (strength: "soft" | "medium" | "strong") => {
    try {
      await setAppearance({ haptic_strength: strength });
      toast({
        title: "Intensidade Háptica",
        description: `Vibração configurada para: ${
          strength === "soft" ? "Suave (15ms)" : strength === "medium" ? "Média (30ms)" : "Firme (60ms)"
        }.`,
      });
    } catch (err) {
      console.warn("[AppearanceView] Erro ao alterar força háptica:", err);
    }
  };

  const handleButtonRadiusChange = async (radius: "sharp" | "smooth" | "pill") => {
    try {
      await setAppearance({ button_radius: radius });
      toast({
        title: "Formato dos Botões",
        description: `Cantos ajustados para: ${
          radius === "sharp" ? "Reto (6px)" : radius === "smooth" ? "Suave (12px)" : "Pílula (24px)"
        }.`,
      });
    } catch (err) {
      console.warn("[AppearanceView] Erro ao alterar raio dos botões:", err);
    }
  };

  const handleToggleLabels = async (show: boolean) => {
    try {
      await setAppearance({ show_labels: show });
      toast({
        title: "Rótulos dos Botões",
        description: show ? "Nomes dos botões visíveis." : "Modo minimalista (somente ícones) ativo.",
      });
    } catch (err) {
      console.warn("[AppearanceView] Erro ao alternar rótulos:", err);
    }
  };

  const handleLabelFontSizeChange = async (size: "compact" | "normal" | "large") => {
    try {
      await setAppearance({ label_font_size: size });
      toast({
        title: "Tamanho da Fonte",
        description: `Fonte dos botões definida como "${
          size === "compact" ? "Compacta" : size === "normal" ? "Padrão" : "Grande"
        }".`,
      });
    } catch (err) {
      console.warn("[AppearanceView] Erro ao alterar tamanho da fonte:", err);
    }
  };

  const handleToggleGlow = async (enabled: boolean) => {
    try {
      await setAppearance({ glow_enabled: enabled });
      toast({
        title: "Efeito Glow Neon",
        description: enabled ? "Brilho nos botões ativado." : "Brilho nos botões desativado.",
      });
    } catch (err) {
      console.warn("[AppearanceView] Erro ao alternar glow:", err);
    }
  };

  const handleSelectIconStyle = async (style: "linha" | "preenchido") => {
    try {
      await setAppearance({ icon_style: style });
      toast({
        title: "Estilo de Ícones",
        description: `Ícones definidos como "${style === "linha" ? "Linha (Outline)" : "Preenchido (Solid)"}".`,
      });
    } catch (err) {
      console.warn("[AppearanceView] Erro ao alternar estilo de ícones:", err);
    }
  };

  const handleResetDefaults = async () => {
    if (accentDebounceTimer.current) clearTimeout(accentDebounceTimer.current);
    if (bgDebounceTimer.current) clearTimeout(bgDebounceTimer.current);
    try {
      await setAppearance({
        theme: "escuro",
        accent_color: "purple",
        custom_accent_hex: null,
        custom_bg_hex: null,
        grid_columns: 5,
        vibration_enabled: true,
        haptic_strength: "medium",
        icon_style: "linha",
        button_radius: "smooth",
        show_labels: true,
        label_font_size: "normal",
        glow_enabled: false,
      });
      setSliderValue([5]);
      setCustomHexInput("#6366f1");
      setCustomBgInput("#0a0a0c");
      toast({
        title: "Padrões Restaurados",
        description: "Todas as preferências de aparência e cores foram resetadas.",
      });
    } catch (err) {
      console.warn("[AppearanceView] Erro ao restaurar padrões:", err);
    }
  };

  // Dinâmica de classes por tema
  const cardBgClass = isLight
    ? "bg-white/90 border-slate-200/90 shadow-sm hover:border-slate-300"
    : isAmoled
    ? "bg-neutral-950/90 border-neutral-900 shadow-sm hover:border-neutral-800"
    : "bg-neutral-900/60 border-neutral-800/80 shadow-sm hover:bg-neutral-900/80";

  const textPrimaryClass = isLight ? "text-slate-800" : isAmoled ? "text-white" : "text-neutral-200";
  const textSecondaryClass = isLight ? "text-slate-500" : "text-neutral-400";
  const iconBubbleClass = isLight
    ? "bg-slate-100 border-slate-200 text-slate-700"
    : isAmoled
    ? "bg-neutral-900 border-neutral-800 text-neutral-300"
    : "bg-neutral-800/80 border-neutral-700/60 text-neutral-300";

  const previewRadiusClass = getButtonRadiusClass(buttonRadius);
  const previewFontSizeClass = getLabelFontSizeClass(labelFontSize);

  return (
    <div
      style={customBgHex ? { backgroundColor: customBgHex } : undefined}
      className={`flex-1 flex flex-col min-w-0 p-6 md:p-8 overflow-y-auto select-none transition-colors duration-200 ${
        customBgHex
          ? isCustomBgLight
            ? "text-slate-900"
            : "text-white"
          : isLight
          ? "bg-slate-50/90 text-slate-900"
          : isAmoled
          ? "bg-black text-white"
          : "bg-neutral-950/70 text-neutral-100"
      }`}
    >
      <div className="space-y-6 max-w-3xl mx-auto w-full flex-1">
        {/* Header: Título "Aparência" e Botão Reset */}
        <header className="pb-2 flex items-center justify-between">
          <div>
            <h1
              className={`text-2xl font-bold tracking-tight ${
                isLight ? "text-slate-900" : isAmoled ? "text-white" : "text-neutral-100"
              }`}
            >
              Aparência
            </h1>
            <p className={`text-xs mt-1 ${textSecondaryClass}`}>
              Personalize o tema visual, paleta de cores, tipografia, geometria dos botões e resposta tátil.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetDefaults}
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
              isLight
                ? "border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 bg-white shadow-sm"
                : "border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 bg-neutral-900/60"
            }`}
            title="Restaurar todas as configurações de aparência padrão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restaurar Padrões</span>
          </button>
        </header>

        {/* ========================================================
            PALCO DE PREVIEW AO VIVO (INTERACTIVE STAGE)
            Demonstração em tempo real das preferências ativas
           ======================================================== */}
        <div
          style={{
            borderColor: `${accent.hex}33`,
            backgroundColor: customBgHex
              ? customBgHex
              : isLight
              ? "#ffffff"
              : isAmoled
              ? "#000000"
              : "rgba(23, 23, 23, 0.7)",
          }}
          className="border rounded-2xl p-5 transition-all backdrop-blur-md relative overflow-hidden shadow-md"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: accent.hex }} />
              <span className={`text-xs font-semibold tracking-wider uppercase ${textPrimaryClass}`}>
                Palco de Demonstração (Ao Vivo)
              </span>
            </div>
            <span className={`text-[11px] font-mono ${textSecondaryClass}`}>
              {rawTheme.toUpperCase()} • {accent.label} • {buttonRadius}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3.5 sm:gap-5">
            {/* Botão de Exemplo 1: Calculadora */}
            <div
              style={{
                borderColor: `${accent.hex}44`,
                boxShadow: glowEnabled ? `0 0 16px -2px ${accent.hex}40` : undefined,
              }}
              className={`p-3 border flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:scale-105 active:scale-95 select-none ${previewRadiusClass} ${
                isLight ? "bg-white shadow-sm" : isAmoled ? "bg-neutral-950" : "bg-neutral-900/90"
              }`}
            >
              <div
                style={{
                  backgroundColor: `${accent.hex}18`,
                  borderColor: `${accent.hex}33`,
                }}
                className={`w-9 h-9 border flex items-center justify-center mb-1.5 transition-transform ${previewRadiusClass}`}
              >
                <Calculator
                  className="w-4 h-4"
                  style={{ color: accent.hex }}
                  strokeWidth={iconStyle === "preenchido" ? 2.5 : 2}
                />
              </div>
              {showLabels && (
                <span className={`font-medium truncate w-full ${previewFontSizeClass.title} ${textPrimaryClass}`}>
                  Calculadora
                </span>
              )}
            </div>

            {/* Botão de Exemplo 2: Mudo (Microfone) */}
            <div
              style={{
                borderColor: `${accent.hex}44`,
                boxShadow: glowEnabled ? `0 0 16px -2px ${accent.hex}40` : undefined,
              }}
              className={`p-3 border flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:scale-105 active:scale-95 select-none ${previewRadiusClass} ${
                isLight ? "bg-white shadow-sm" : isAmoled ? "bg-neutral-950" : "bg-neutral-900/90"
              }`}
            >
              <div
                style={{
                  backgroundColor: `${accent.hex}18`,
                  borderColor: `${accent.hex}33`,
                }}
                className={`w-9 h-9 border flex items-center justify-center mb-1.5 transition-transform ${previewRadiusClass}`}
              >
                <MicOff
                  className="w-4 h-4"
                  style={{ color: accent.hex }}
                  strokeWidth={iconStyle === "preenchido" ? 2.5 : 2}
                />
              </div>
              {showLabels && (
                <span className={`font-medium truncate w-full ${previewFontSizeClass.title} ${textPrimaryClass}`}>
                  Mudo
                </span>
              )}
            </div>

            {/* Botão de Exemplo 3: Play / Mídia */}
            <div
              style={{
                borderColor: `${accent.hex}44`,
                boxShadow: glowEnabled ? `0 0 16px -2px ${accent.hex}40` : undefined,
              }}
              className={`p-3 border flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:scale-105 active:scale-95 select-none ${previewRadiusClass} ${
                isLight ? "bg-white shadow-sm" : isAmoled ? "bg-neutral-950" : "bg-neutral-900/90"
              }`}
            >
              <div
                style={{
                  backgroundColor: `${accent.hex}18`,
                  borderColor: `${accent.hex}33`,
                }}
                className={`w-9 h-9 border flex items-center justify-center mb-1.5 transition-transform ${previewRadiusClass}`}
              >
                <Play
                  className="w-4 h-4"
                  style={{ color: accent.hex }}
                  fill={iconStyle === "preenchido" ? accent.hex : "none"}
                  strokeWidth={iconStyle === "preenchido" ? 2.5 : 2}
                />
              </div>
              {showLabels && (
                <span className={`font-medium truncate w-full ${previewFontSizeClass.title} ${textPrimaryClass}`}>
                  Mídia Play
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lista Vertical de Configurações */}
        <div className="space-y-4">
          {/* Card 1: Seleção de Tema (Sistema, Escuro, Claro, AMOLED) */}
          <div className={`border rounded-2xl p-5 transition-colors backdrop-blur-sm ${cardBgClass}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${iconBubbleClass}`}>
                <Contrast className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-sm font-semibold ${textPrimaryClass}`}>Tema da Interface</span>
                <p className={`text-[11px] ${textSecondaryClass}`}>
                  Sincronizado automaticamente entre o desktop e o app mobile
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "sistema", label: "Sistema (Auto)", icon: Monitor },
                { id: "escuro", label: "Escuro", icon: Moon },
                { id: "claro", label: "Claro", icon: Sun },
                { id: "amoled", label: "AMOLED", icon: Flame },
              ].map((t) => {
                const isSelected = rawTheme === t.id;
                const IconComp = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleThemeChange(t.id as any)}
                    style={
                      isSelected
                        ? {
                            borderColor: accent.hex,
                            backgroundColor: `${accent.hex}15`,
                          }
                        : undefined
                    }
                    className={`border rounded-xl p-3 flex items-center gap-2.5 transition-all text-left relative ${
                      isSelected
                        ? "shadow-sm"
                        : isLight
                        ? "border-slate-200 bg-slate-50/70 hover:bg-slate-100"
                        : "border-neutral-800 bg-neutral-950/60 hover:bg-neutral-900"
                    }`}
                  >
                    {isSelected && (
                      <span
                        style={{ backgroundColor: accent.hex }}
                        className="absolute top-2 right-2 w-2 h-2 rounded-full"
                      />
                    )}
                    <IconComp
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: isSelected ? accent.hex : undefined }}
                    />
                    <span className={`text-xs font-semibold truncate ${textPrimaryClass}`}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Cor de destaque e Efeito Glow */}
          <div className={`border rounded-2xl p-5 transition-colors backdrop-blur-sm ${cardBgClass}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${iconBubbleClass}`}>
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <span className={`text-sm font-semibold ${textPrimaryClass}`}>Cor de Destaque</span>
                  <p className={`text-[11px] ${textSecondaryClass}`}>
                    Cor ativa: <strong style={{ color: accent.hex }}>{accent.label}</strong> ({accent.hex})
                  </p>
                </div>
              </div>

              {/* Glow Toggle */}
              <div className="flex items-center gap-2">
                <span className={`text-xs ${textSecondaryClass}`}>Brilho Neon</span>
                <Switch
                  checked={glowEnabled}
                  onCheckedChange={handleToggleGlow}
                  style={glowEnabled ? { backgroundColor: accent.hex } : undefined}
                  className={`data-[state=checked]:bg-indigo-600 ${
                    isLight
                      ? "data-[state=unchecked]:bg-slate-300 border-slate-300"
                      : "data-[state=unchecked]:bg-neutral-800 border-neutral-700"
                  }`}
                />
              </div>
            </div>

            {/* Grid de 9 Cores Pré-definidas */}
            <div className="flex flex-wrap items-center gap-2.5 pb-3">
              {ACCENT_OPTIONS.map((col) => {
                const isSelected = accent.id === col.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => handleSelectColor(col)}
                    title={col.label}
                    style={{ backgroundColor: col.hex }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-sm ${
                      isSelected
                        ? "ring-2 ring-offset-2 ring-white scale-110 shadow-md"
                        : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            {/* Seletor Customizado HEX (Native Color Picker com Debounce e Sem Flood de Toasts) */}
            <div
              className={`pt-3 border-t flex flex-wrap items-center justify-between gap-3 ${
                isLight ? "border-slate-100" : "border-neutral-800/80"
              }`}
            >
              <div className="flex items-center gap-2">
                <Pipette className={`w-4 h-4 ${textSecondaryClass}`} />
                <span className={`text-xs ${textSecondaryClass}`}>Cor Personalizada:</span>
                <div className="relative flex items-center">
                  <input
                    type="color"
                    value={accent.hex.startsWith("#") ? accent.hex : "#6366f1"}
                    onChange={(e) => handleAccentPickerDrag(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 overflow-hidden bg-transparent"
                    title="Selecione na roda de cores"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={7}
                  value={customHexInput}
                  onChange={(e) => setCustomHexInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleApplyCustomHex(customHexInput);
                  }}
                  placeholder="#6366f1"
                  className={`w-24 px-2 py-1 text-xs font-mono rounded-lg border outline-none ${
                    isLight
                      ? "bg-slate-100 border-slate-200 text-slate-800 focus:border-indigo-500"
                      : "bg-neutral-950 border-neutral-800 text-neutral-200 focus:border-indigo-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleApplyCustomHex(customHexInput)}
                  style={{ borderColor: `${accent.hex}66`, color: accent.hex }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                    isLight
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      : "bg-neutral-900 hover:bg-neutral-800 text-neutral-300"
                  }`}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: NOVO - Manipulação de Cor de Fundo da Interface (Padrão & Personalizada) */}
          <div className={`border rounded-2xl p-5 transition-colors backdrop-blur-sm ${cardBgClass}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${iconBubbleClass}`}>
                  <Paintbrush className="w-4 h-4" />
                </div>
                <div>
                  <span className={`text-sm font-semibold ${textPrimaryClass}`}>Cor de Fundo da Interface</span>
                  <p className={`text-[11px] ${textSecondaryClass}`}>
                    Fundo ativo:{" "}
                    <strong>
                      {customBgHex
                        ? `Personalizada (${customBgHex.toUpperCase()})`
                        : `Padrão do Tema (${resolvedTheme.toUpperCase()})`}
                    </strong>
                  </p>
                </div>
              </div>

              {customBgHex && (
                <button
                  type="button"
                  onClick={handleResetBgToTheme}
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    isLight
                      ? "border-slate-300 hover:border-slate-400 bg-slate-100 text-slate-700"
                      : "border-neutral-700 hover:border-neutral-600 bg-neutral-900 text-neutral-300"
                  }`}
                  title="Reverter para o fundo padrão nativo do tema"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Fundo do Tema</span>
                </button>
              )}
            </div>

            {/* Presets de Cor de Fundo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-3">
              {BG_PRESETS.map((bgOpt) => {
                const isSelected = customBgHex?.toLowerCase() === bgOpt.hex.toLowerCase();
                return (
                  <button
                    key={bgOpt.id}
                    type="button"
                    onClick={() => handleSelectBgPreset(bgOpt)}
                    style={{
                      backgroundColor: bgOpt.hex,
                      borderColor: isSelected ? accent.hex : undefined,
                    }}
                    className={`h-11 px-3 rounded-xl border flex items-center justify-between transition-all ${
                      isSelected
                        ? "ring-2 ring-offset-2 ring-white scale-[1.02] shadow-md font-semibold"
                        : "opacity-85 hover:opacity-100 border-neutral-700/60 hover:scale-[1.01]"
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        bgOpt.isLight ? "text-slate-900" : "text-white"
                      }`}
                    >
                      {bgOpt.label}
                    </span>
                    {isSelected && (
                      <Check
                        className={`w-3.5 h-3.5 stroke-[3] ${
                          bgOpt.isLight ? "text-slate-900" : "text-white"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Seletor Customizado de Cor de Fundo */}
            <div
              className={`pt-3 border-t flex flex-wrap items-center justify-between gap-3 ${
                isLight ? "border-slate-100" : "border-neutral-800/80"
              }`}
            >
              <div className="flex items-center gap-2">
                <Pipette className={`w-4 h-4 ${textSecondaryClass}`} />
                <span className={`text-xs ${textSecondaryClass}`}>Fundo Personalizado:</span>
                <div className="relative flex items-center">
                  <input
                    type="color"
                    value={customBgHex || "#0a0a0c"}
                    onChange={(e) => handleBgPickerDrag(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 overflow-hidden bg-transparent"
                    title="Seletor de cor de fundo livre"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={7}
                  value={customBgInput}
                  onChange={(e) => setCustomBgInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleApplyCustomBg(customBgInput);
                  }}
                  placeholder="#0a0a0c"
                  className={`w-24 px-2 py-1 text-xs font-mono rounded-lg border outline-none ${
                    isLight
                      ? "bg-slate-100 border-slate-200 text-slate-800 focus:border-indigo-500"
                      : "bg-neutral-950 border-neutral-800 text-neutral-200 focus:border-indigo-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleApplyCustomBg(customBgInput)}
                  style={{ borderColor: `${accent.hex}66`, color: accent.hex }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                    isLight
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      : "bg-neutral-900 hover:bg-neutral-800 text-neutral-300"
                  }`}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Geometria e Arredondamento dos Botões */}
          <div className={`border rounded-2xl p-5 transition-colors backdrop-blur-sm ${cardBgClass}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${iconBubbleClass}`}>
                <Square className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-sm font-semibold ${textPrimaryClass}`}>Formato & Arredondamento dos Cantos</span>
                <p className={`text-[11px] ${textSecondaryClass}`}>
                  Escolha o contorno visual dos botões no desktop e no mobile
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "sharp", label: "Reto", radius: "rounded-md" },
                { id: "smooth", label: "Suave", radius: "rounded-xl" },
                { id: "pill", label: "Pílula", radius: "rounded-3xl" },
              ].map((item) => {
                const isSelected = buttonRadius === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleButtonRadiusChange(item.id as any)}
                    style={
                      isSelected
                        ? {
                            borderColor: accent.hex,
                            backgroundColor: `${accent.hex}15`,
                          }
                        : undefined
                    }
                    className={`border p-3 flex flex-col items-center justify-center gap-2 transition-all ${
                      item.radius
                    } ${
                      isSelected
                        ? "shadow-sm"
                        : isLight
                        ? "border-slate-200 bg-slate-50/70 hover:bg-slate-100"
                        : "border-neutral-800 bg-neutral-950/60 hover:bg-neutral-900"
                    }`}
                  >
                    <div
                      style={{
                        borderColor: isSelected ? accent.hex : undefined,
                        backgroundColor: isSelected ? `${accent.hex}25` : undefined,
                      }}
                      className={`w-7 h-7 border-2 border-dashed ${item.radius} flex items-center justify-center`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" style={{ color: accent.hex }} />}
                    </div>
                    <span className={`text-xs font-semibold ${textPrimaryClass}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 5: Tamanho dos Botões (Escala de 1 a 10) */}
          <div
            className={`border rounded-2xl px-5 py-4 flex items-center justify-between gap-3 transition-colors backdrop-blur-sm ${cardBgClass}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 ${iconBubbleClass}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold truncate ${textPrimaryClass}`}>
                    Tamanho dos Botões
                  </span>
                  {sliderValue[0] === 5 && (
                    <span
                      style={{ color: accent.hex, borderColor: `${accent.hex}40` }}
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-neutral-500/10"
                    >
                      Padrão Celular
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[11px] ${textSecondaryClass}`}>
                    Nível: <strong className={textPrimaryClass}>{sliderValue[0] || 5}</strong> / 10
                  </span>
                  {sliderValue[0] !== 5 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSliderValue([5]);
                        handleButtonDimensionCommit([5]);
                      }}
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border transition-colors ${
                        isLight
                          ? "border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-900 bg-slate-100"
                          : "border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-neutral-200 bg-neutral-900"
                      }`}
                      title="Sincronizar com a resolução padrão do celular"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Sincronizar (5)
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 w-36 sm:w-48 md:w-56 flex-shrink-0">
              <span className={`text-xs font-mono ${textSecondaryClass}`}>1</span>
              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                onValueCommit={handleButtonDimensionCommit}
                min={1}
                max={10}
                step={1}
                className={`flex-1 ${
                  isLight
                    ? "[&_.relative]:bg-slate-200 [&_[role=slider]]:bg-white [&_[role=slider]]:border-slate-400"
                    : "[&_.relative]:bg-neutral-800 [&_[role=slider]]:bg-white [&_[role=slider]]:border-neutral-600"
                }`}
              />
              <span className={`text-xs font-mono ${textSecondaryClass}`}>10</span>
            </div>
          </div>

          {/* Card 6: Tipografia & Rótulos dos Botões */}
          <div className={`border rounded-2xl p-5 transition-colors backdrop-blur-sm ${cardBgClass}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${iconBubbleClass}`}>
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <span className={`text-sm font-semibold ${textPrimaryClass}`}>Rótulos & Tipografia</span>
                  <p className={`text-[11px] ${textSecondaryClass}`}>
                    Exibir ou ocultar os títulos nos botões (modo minimalista para streamers)
                  </p>
                </div>
              </div>

              <Switch
                checked={showLabels}
                onCheckedChange={handleToggleLabels}
                style={showLabels ? { backgroundColor: accent.hex } : undefined}
                className={`data-[state=checked]:bg-emerald-500 ${
                  isLight
                    ? "data-[state=unchecked]:bg-slate-300 border-slate-300"
                    : "data-[state=unchecked]:bg-neutral-800 border-neutral-700"
                }`}
              />
            </div>

            {/* Seletor de Tamanho da Fonte */}
            {showLabels && (
              <div
                className={`pt-3 border-t flex items-center justify-between ${
                  isLight ? "border-slate-100" : "border-neutral-800/80"
                }`}
              >
                <span className={`text-xs ${textSecondaryClass}`}>Tamanho do Texto:</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "compact", label: "Compacto" },
                    { id: "normal", label: "Padrão" },
                    { id: "large", label: "Grande" },
                  ].map((sizeOpt) => {
                    const isSelected = labelFontSize === sizeOpt.id;
                    return (
                      <button
                        key={sizeOpt.id}
                        type="button"
                        onClick={() => handleLabelFontSizeChange(sizeOpt.id as any)}
                        style={
                          isSelected
                            ? {
                                borderColor: accent.hex,
                                backgroundColor: `${accent.hex}20`,
                                color: accent.hex,
                              }
                            : undefined
                        }
                        className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${
                          isSelected
                            ? "shadow-sm"
                            : isLight
                            ? "border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900"
                            : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-neutral-200"
                        }`}
                      >
                        {sizeOpt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Card 7: Estilo de Ícones (Linha vs Preenchido) */}
          <div
            className={`border rounded-2xl px-5 py-4 flex items-center justify-between transition-colors backdrop-blur-sm ${cardBgClass}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${iconBubbleClass}`}>
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-sm font-semibold ${textPrimaryClass}`}>Estilo de Ícones</span>
                <p className={`text-[11px] ${textSecondaryClass}`}>
                  Alterne entre contorno vazado (Outline) e preenchido sólido
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectIconStyle("linha")}
                style={
                  iconStyle === "linha"
                    ? {
                        borderColor: accent.hex,
                        backgroundColor: `${accent.hex}20`,
                        color: accent.hex,
                      }
                    : undefined
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  iconStyle === "linha"
                    ? "shadow-sm"
                    : isLight
                    ? "border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900"
                    : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {iconStyle === "linha" && <Check className="w-3.5 h-3.5" />}
                <span>Linha</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectIconStyle("preenchido")}
                style={
                  iconStyle === "preenchido"
                    ? {
                        borderColor: accent.hex,
                        backgroundColor: `${accent.hex}20`,
                        color: accent.hex,
                      }
                    : undefined
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  iconStyle === "preenchido"
                    ? "shadow-sm"
                    : isLight
                    ? "border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900"
                    : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {iconStyle === "preenchido" && <Check className="w-3.5 h-3.5" />}
                <span>Preenchido</span>
              </button>
            </div>
          </div>

          {/* Card 8: Resposta Tátil Mobile (Haptics) */}
          <div className={`border rounded-2xl p-5 transition-colors backdrop-blur-sm ${cardBgClass}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${iconBubbleClass}`}>
                  <Vibrate className="w-4 h-4" />
                </div>
                <div>
                  <span className={`text-sm font-semibold ${textPrimaryClass}`}>Vibração ao Tocar (Haptics)</span>
                  <p className={`text-[11px] ${textSecondaryClass}`}>
                    Resposta física nos toques dos botões no smartphone
                  </p>
                </div>
              </div>

              <Switch
                checked={vibrationEnabled}
                onCheckedChange={handleToggleVibration}
                style={vibrationEnabled ? { backgroundColor: accent.hex } : undefined}
                className={`data-[state=checked]:bg-emerald-500 ${
                  isLight
                    ? "data-[state=unchecked]:bg-slate-300 border-slate-300"
                    : "data-[state=unchecked]:bg-neutral-800 border-neutral-700"
                }`}
              />
            </div>

            {vibrationEnabled && (
              <div
                className={`pt-3 border-t flex items-center justify-between ${
                  isLight ? "border-slate-100" : "border-neutral-800/80"
                }`}
              >
                <span className={`text-xs ${textSecondaryClass}`}>Intensidade:</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "soft", label: "Suave (15ms)" },
                    { id: "medium", label: "Média (30ms)" },
                    { id: "strong", label: "Firme (60ms)" },
                  ].map((hOpt) => {
                    const isSelected = hapticStrength === hOpt.id;
                    return (
                      <button
                        key={hOpt.id}
                        type="button"
                        onClick={() => handleHapticStrengthChange(hOpt.id as any)}
                        style={
                          isSelected
                            ? {
                                borderColor: accent.hex,
                                backgroundColor: `${accent.hex}20`,
                                color: accent.hex,
                              }
                            : undefined
                        }
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                          isSelected
                            ? "shadow-sm"
                            : isLight
                            ? "border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900"
                            : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-neutral-200"
                        }`}
                      >
                        {hOpt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rodapé: Dica de Produtividade */}
      <footer className="mt-auto pt-8 pb-2 text-center">
        <p className={`text-xs leading-relaxed max-w-lg mx-auto ${textSecondaryClass}`}>
          Dica: As preferências visuais, paletas e cores de fundo personalizadas são sincronizadas em tempo real.
        </p>
      </footer>
    </div>
  );
}

export default AppearanceView;
