import React from 'react';
import { Image, StyleSheet } from 'react-native';
import {
  Zap,
  Volume2,
  Volume1,
  VolumeX,
  Mic,
  MicOff,
  Play,
  Pause,
  Calculator,
  Globe,
  Settings,
  Folder,
  FolderOpen,
  Terminal,
  Sparkles,
  Sun,
  Moon,
  Camera,
  Lock,
  SkipForward,
  SkipBack,
  Rewind,
  FastForward,
  ExternalLink,
  Laptop,
  Monitor,
  Radio,
  Info,
  Check,
  Music,
  Code,
  Sliders,
  Video,
  type LucideIcon,
} from 'lucide-react-native';

interface MobileIconProps {
  iconName?: string;
  size?: number;
  color?: string;
  iconStyle?: 'linha' | 'preenchido' | string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  zap: Zap,
  calc: Calculator,
  calculator: Calculator,
  globe: Globe,
  browser: Globe,
  url: ExternalLink,
  externallink: ExternalLink,
  terminal: Terminal,
  cmd: Terminal,
  powershell: Terminal,
  code: Code,
  folder: Folder,
  folderopen: FolderOpen,
  explorer: FolderOpen,
  volume: Volume2,
  volup: Volume2,
  volume2: Volume2,
  voldown: Volume1,
  volume1: Volume1,
  volmute: VolumeX,
  volumex: VolumeX,
  mic: Mic,
  mudo: Mic,
  mute: Mic,
  micoff: MicOff,
  play: Play,
  playpause: Play,
  pause: Pause,
  camera: Camera,
  câmera: Camera,
  trancar: Lock,
  lock: Lock,
  skipforward: SkipForward,
  skipback: SkipBack,
  próximo: SkipForward,
  proximo: SkipForward,
  anterior: SkipBack,
  rewind: Rewind,
  fastforward: FastForward,
  sparkles: Sparkles,
  sun: Sun,
  brilho: Sun,
  moon: Moon,
  settings: Settings,
  sliders: Sliders,
  monitor: Monitor,
  laptop: Laptop,
  radio: Radio,
  music: Music,
  música: Music,
  info: Info,
  sobre: Info,
  check: Check,
  video: Video,
  obs: Video,
};

export const MobileIcon: React.FC<MobileIconProps> = ({
  iconName,
  size = 24,
  color = '#ffffff',
  iconStyle = 'linha',
}) => {
  const strokeWidth = iconStyle === 'preenchido' ? 2.8 : 1.8;

  if (!iconName) {
    return <Zap size={size} color={color} strokeWidth={strokeWidth} />;
  }

  // Se for ícone base64 extraído do Windows
  if (iconName.startsWith('base64:') || iconName.startsWith('data:image')) {
    const uri = iconName.startsWith('base64:')
      ? `data:image/png;base64,${iconName.slice(7)}`
      : iconName;
    return (
      <Image
        source={{ uri }}
        style={[styles.base64Image, { width: size, height: size }]}
        resizeMode="contain"
      />
    );
  }

  const normalized = iconName.toLowerCase().replace(/[-_\s]/g, '');
  const IconComponent = ICON_MAP[normalized] || Zap;

  return <IconComponent size={size} color={color} strokeWidth={strokeWidth} />;
};

const styles = StyleSheet.create({
  base64Image: {
    borderRadius: 4,
  },
});
