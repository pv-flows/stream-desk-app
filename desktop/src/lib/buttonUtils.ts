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
  type LucideIcon,
} from "lucide-react";

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
