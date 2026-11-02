import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { CentralArea } from "@/components/layout/CentralArea";
import { MobilePreview } from "@/components/layout/MobilePreview";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useDashboardStore } from "@/store/useDashboardStore";
import { getAccentColor } from "@/lib/buttonUtils";
import "./App.css";

export function App() {
  const init = useDashboardStore((s) => s.init);
  const theme = useDashboardStore((s) => s.theme);
  const appearance = useDashboardStore((s) => s.appearance);
  const [activeTab, setActiveTab] = useState("connection");

  useEffect(() => {
    init();
  }, [init]);

  const [systemPrefersDark, setSystemPrefersDark] = useState(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : true
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const normalizedTheme = (appearance?.theme || theme || "escuro").toLowerCase();
  const effectiveTheme =
    normalizedTheme === "sistema" || normalizedTheme === "auto"
      ? systemPrefersDark
        ? "escuro"
        : "claro"
      : normalizedTheme;

  const isLight = effectiveTheme === "claro" || effectiveTheme === "light";
  const isAmoled = effectiveTheme === "amoled";
  const accent = getAccentColor(appearance?.accent_color, appearance?.custom_accent_hex);

  // Sincroniza classes no elemento raiz html e variáveis CSS de cor de destaque e geometria
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "amoled");
    if (isLight) {
      root.classList.add("light");
    } else if (isAmoled) {
      root.classList.add("dark", "amoled");
    } else {
      root.classList.add("dark");
    }
    root.style.setProperty("--accent-primary", accent.hex);

    const radius =
      appearance?.button_radius === "sharp"
        ? "6px"
        : appearance?.button_radius === "pill"
        ? "24px"
        : "12px";
    root.style.setProperty("--button-radius", radius);

    const glow =
      appearance?.glow_enabled !== false
        ? `0 0 18px ${accent.hex}30`
        : "none";
    root.style.setProperty("--deck-glow", glow);
  }, [isLight, isAmoled, accent.hex, appearance?.button_radius, appearance?.glow_enabled]);

  const appBgClass = isLight
    ? "bg-slate-100 text-slate-900"
    : isAmoled
    ? "bg-black text-white"
    : "bg-neutral-950 text-white";

  return (
    <div
      className={`h-screen w-screen flex ${appBgClass} overflow-hidden min-w-[720px] min-h-[520px] transition-colors duration-200`}
    >
      {/* 1. Barra Lateral de Navegação (recolhível automaticamente em 4:3 ou sob demanda) */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* 2. Área Central Dinâmica (fluida e protegida contra crashes) */}
      <ErrorBoundary key={activeTab}>
        <CentralArea activeTab={activeTab} />
      </ErrorBoundary>

      {/* 3. Painel de Pré-visualização Mobile (320px fixa, sem barras de rolagem) */}
      <MobilePreview />

      {/* Notificações Toaster Global */}
      <Toaster />
    </div>
  );
}

export default App;
