import {
  Zap,
  ExternalLink,
  Terminal,
  FolderOpen,
  Volume2,
  Volume1,
  VolumeX,
  Play,
  Pause,
  Calculator,
  Monitor,
  Music,
  Sparkles,
  Command,
  FileText,
  Video,
  type LucideIcon,
} from "lucide-react";

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

export function getAccentColor(accentId?: string, customHex?: string | null): AccentOption {
  if (accentId === "custom" && customHex) {
    return {
      id: "custom",
      label: "Personalizada",
      hex: customHex,
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

export function getLucideIcon(iconName?: string): LucideIcon {
  if (!iconName) return Zap;
  const name = iconName.toLowerCase().replace(/[-_]/g, "");
  switch (name) {
    case "calc":
    case "calculator":
      return Calculator;
    case "browser":
    case "globe":
    case "url":
    case "externallink":
      return ExternalLink;
    case "terminal":
    case "cmd":
    case "powershell":
    case "code":
      return Terminal;
    case "folder":
    case "folderopen":
    case "explorer":
      return FolderOpen;
    case "volume":
    case "volup":
    case "volume2":
      return Volume2;
    case "voldown":
    case "volume1":
      return Volume1;
    case "volmute":
    case "volumex":
      return VolumeX;
    case "play":
    case "playpause":
      return Play;
    case "pause":
      return Pause;
    case "sparkles":
      return Sparkles;
    case "monitor":
      return Monitor;
    case "music":
      return Music;
    case "command":
      return Command;
    case "doc":
    case "file":
    case "filetext":
      return FileText;
    case "video":
    case "obs":
    case "camera":
      return Video;
    case "zap":
    default:
      return Zap;
  }
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
