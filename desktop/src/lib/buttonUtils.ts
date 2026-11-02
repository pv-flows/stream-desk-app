import { Zap, type LucideIcon } from "lucide-react";
import { ICON_MAP_BY_ID } from "./iconCatalog";

export function isBase64Icon(icon?: string): boolean {
  if (!icon) return false;
  return icon.startsWith("base64:") || icon.startsWith("data:image");
}

export function getBase64Src(icon?: string): string {
  if (!icon) return "";
  if (icon.startsWith("base64:")) {
    return `data:image/png;base64,${icon.slice(7)}`;
  }
  return icon;
}

export interface AccentOption {
  id: string;
  label: string;
  hex: string;
  bgClass: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: "purple", label: "Roxo", hex: "#6366f1", bgClass: "bg-indigo-600" },
  { id: "blue", label: "Azul", hex: "#3b82f6", bgClass: "bg-sky-500" },
  { id: "teal", label: "Turquesa", hex: "#0d9488", bgClass: "bg-teal-600" },
  { id: "green", label: "Verde", hex: "#10b981", bgClass: "bg-emerald-500" },
  { id: "yellow", label: "Amarelo", hex: "#f59e0b", bgClass: "bg-amber-400" },
  { id: "orange", label: "Laranja", hex: "#f97316", bgClass: "bg-orange-500" },
  { id: "red", label: "Vermelho", hex: "#f43f5e", bgClass: "bg-rose-500" },
  { id: "fuchsia", label: "Fúcsia", hex: "#d946ef", bgClass: "bg-fuchsia-500" },
  { id: "slate", label: "Grafite", hex: "#64748b", bgClass: "bg-slate-500" },
];

export interface BgPreset {
  id: string;
  label: string;
  hex: string;
  isLight: boolean;
}

export const BG_PRESETS: BgPreset[] = [
  // Presets Escuros (Dark)
  { id: "dark_studio", label: "Estúdio Grafite", hex: "#0a0a0c", isLight: false },
  { id: "midnight", label: "Azul Meia-Noite", hex: "#0b101b", isLight: false },
  { id: "slate_dark", label: "Ardósia Escura", hex: "#0f172a", isLight: false },
  { id: "charcoal", label: "Carvão Zinc", hex: "#18181b", isLight: false },
  { id: "matte_grey", label: "Cinza Fosco", hex: "#22252a", isLight: false },
  // Preset AMOLED (Preto Puro)
  { id: "amoled_pure", label: "AMOLED Puro", hex: "#000000", isLight: false },
  // Presets Claros (Light)
  { id: "slate_light", label: "Névoa Clara", hex: "#f8fafc", isLight: true },
  { id: "pure_white", label: "Branco Puro", hex: "#ffffff", isLight: true },
  { id: "warm_gray", label: "Cinza Suave", hex: "#f3f4f6", isLight: true },
  { id: "soft_zinc", label: "Gelo Zinc", hex: "#f4f4f5", isLight: true },
];

export function isHexColorLight(hex?: string | null): boolean {
  if (!hex) return false;
  const clean = hex.replace("#", "").trim();
  if (clean.length !== 6 && clean.length !== 3) return false;
  let full = clean;
  if (clean.length === 3) {
    full = clean.split("").map((c) => c + c).join("");
  }
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55;
}

export function getAccentColor(
  accentIdOrAppearance?: string | { accent_color?: string; custom_accent_hex?: string | null } | null,
  customHex?: string | null
): AccentOption {
  let accentId: string | undefined;
  let custom: string | null | undefined = customHex;

  if (typeof accentIdOrAppearance === "object" && accentIdOrAppearance !== null) {
    accentId = accentIdOrAppearance.accent_color;
    if (!custom) {
      custom = accentIdOrAppearance.custom_accent_hex;
    }
  } else if (typeof accentIdOrAppearance === "string") {
    accentId = accentIdOrAppearance;
  }

  if (accentId === "custom" && custom) {
    const formatted = custom.startsWith("#") ? custom : `#${custom}`;
    return {
      id: "custom",
      label: `Personalizada (${formatted.toUpperCase()})`,
      hex: formatted,
      bgClass: "bg-neutral-800",
    };
  }
  const found = ACCENT_OPTIONS.find((a) => a.id === accentId);
  return found || ACCENT_OPTIONS[0];
}

export function getButtonRadiusClass(radius?: string): string {
  switch (radius) {
    case "sharp":
      return "rounded-md";
    case "pill":
      return "rounded-3xl";
    case "smooth":
    default:
      return "rounded-xl";
  }
}

export function getLabelFontSizeClass(size?: string): { title: string; subtitle: string } {
  switch (size) {
    case "compact":
      return { title: "text-[10px]", subtitle: "text-[9px]" };
    case "large":
      return { title: "text-sm", subtitle: "text-xs" };
    case "normal":
    default:
      return { title: "text-xs", subtitle: "text-[10px]" };
  }
}

export function resolveAccentColorHex(color?: string, fallback: string = "#38bdf8"): string {
  if (!color) return fallback;
  if (color.startsWith("#") || color.startsWith("rgb")) return color;
  const c = color.toLowerCase();
  if (c.includes("emerald") || c.includes("green")) return "#10b981";
  if (c.includes("amber") || c.includes("yellow") || c.includes("orange")) return "#f59e0b";
  if (c.includes("purple") || c.includes("violet") || c.includes("indigo")) return "#818cf8";
  if (c.includes("rose") || c.includes("red")) return "#f43f5e";
  if (c.includes("blue")) return "#3b82f6";
  if (c.includes("slate") || c.includes("gray")) return "#94a3b8";
  return fallback;
}

const LEGACY_ALIASES: Record<string, string> = {
  browser: "globe",
  calc: "calculator",
  cmd: "terminal",
  powershell: "terminal",
  explorer: "folder-open",
  folderopen: "folder-open",
  url: "external-link",
  externallink: "external-link",
  volup: "volume-2",
  volume: "volume-2",
  voldown: "volume-1",
  volmute: "volume-x",
  playpause: "play",
  obs: "video",
  doc: "file-text",
  file: "file-text",
  filetext: "file-text",
};

export function getLucideIcon(iconName?: string): LucideIcon {
  if (!iconName) return Zap;
  const raw = iconName.toLowerCase().trim();
  const aliased = LEGACY_ALIASES[raw] || raw;
  const sanitized = aliased.replace(/[-_]/g, "");

  return (
    ICON_MAP_BY_ID[aliased] ||
    ICON_MAP_BY_ID[sanitized] ||
    ICON_MAP_BY_ID[raw] ||
    Zap
  );
}

export function getButtonColorStyles(color?: string) {
  if (color && (color.startsWith("#") || color.startsWith("rgb"))) {
    return {
      style: {
        borderColor: `${color}66`,
        background: `linear-gradient(180deg, ${color}26 0%, ${color}40 100%)`,
      },
      className: "hover:border-sky-400/60 shadow-sm",
    };
  }

  const c = (color || "sky").toLowerCase();
  if (c.includes("amber") || c.includes("orange") || c.includes("yellow")) {
    return {
      className:
        "border-amber-500/40 bg-gradient-to-b from-amber-500/20 to-amber-600/30 hover:border-amber-400/70 hover:shadow-amber-500/10",
    };
  }
  if (c.includes("emerald") || c.includes("green")) {
    return {
      className:
        "border-emerald-500/40 bg-gradient-to-b from-emerald-500/20 to-emerald-600/30 hover:border-emerald-400/70 hover:shadow-emerald-500/10",
    };
  }
  if (c.includes("purple") || c.includes("violet")) {
    return {
      className:
        "border-purple-500/40 bg-gradient-to-b from-purple-500/20 to-purple-600/30 hover:border-purple-400/70 hover:shadow-purple-500/10",
    };
  }
  if (c.includes("slate") || c.includes("gray") || c.includes("neutral")) {
    return {
      className:
        "border-slate-500/40 bg-gradient-to-b from-slate-500/20 to-slate-600/30 hover:border-slate-400/70 hover:shadow-slate-500/10",
    };
  }
  if (c.includes("blue") || c.includes("indigo")) {
    return {
      className:
        "border-blue-500/40 bg-gradient-to-b from-blue-500/20 to-blue-600/30 hover:border-blue-400/70 hover:shadow-blue-500/10",
    };
  }

  return {
    className:
      "border-sky-500/40 bg-gradient-to-b from-sky-500/20 to-sky-600/30 hover:border-sky-400/70 hover:shadow-sky-500/10",
  };
}
