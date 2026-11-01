export type SkinId =
  | 'default'
  | 'escuro'
  | 'claro'
  | 'amoled'
  | 'apple'
  | 'windows'
  | 'steam'
  | 'oneui'
  | 'chromebook'
  | 'gamer'
  | 'ios';

export type SkinType = 'glass' | 'solid' | 'flat';

export interface SkinShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface SkinDefinition {
  id: SkinId;
  type: SkinType;
  screenBackground: string;
  backgroundGradient: readonly [string, string, ...string[]];
  backgroundColor: string;
  pressedBackgroundColor: string;
  textColor: string;
  highlightColor: string;
  borderColor: string;
  borderRadius: number;
  borderWidth: number;
  blurIntensity: number;
  blurTint: 'light' | 'dark' | 'default';
  rippleColor: string;
  shadow: SkinShadow;
}

export const skins: Record<SkinId, SkinDefinition> = {
  default: {
    id: 'default',
    type: 'glass',
    screenBackground: '#09090b',
    backgroundGradient: ['#09090b', '#111116', '#18181f'],
    backgroundColor: 'rgba(24, 24, 28, 0.75)',
    pressedBackgroundColor: 'rgba(99, 102, 241, 0.25)',
    textColor: '#f4f4f5',
    highlightColor: '#6366f1',
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 20,
    borderWidth: 1,
    blurIntensity: 35,
    blurTint: 'dark',
    rippleColor: 'rgba(99, 102, 241, 0.25)',
    shadow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 5,
    },
  },
  escuro: {
    id: 'escuro',
    type: 'glass',
    screenBackground: '#09090b',
    backgroundGradient: ['#09090b', '#111116', '#18181f'],
    backgroundColor: 'rgba(24, 24, 28, 0.75)',
    pressedBackgroundColor: 'rgba(99, 102, 241, 0.25)',
    textColor: '#f4f4f5',
    highlightColor: '#6366f1',
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 20,
    borderWidth: 1,
    blurIntensity: 35,
    blurTint: 'dark',
    rippleColor: 'rgba(99, 102, 241, 0.25)',
    shadow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 5,
    },
  },
  amoled: {
    id: 'amoled',
    type: 'solid',
    screenBackground: '#000000',
    backgroundGradient: ['#000000', '#050505', '#0a0a0a'],
    backgroundColor: 'rgba(14, 14, 16, 0.95)',
    pressedBackgroundColor: 'rgba(99, 102, 241, 0.3)',
    textColor: '#ffffff',
    highlightColor: '#6366f1',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    blurIntensity: 0,
    blurTint: 'dark',
    rippleColor: 'rgba(99, 102, 241, 0.3)',
    shadow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 5,
    },
  },
  claro: {
    id: 'claro',
    type: 'glass',
    screenBackground: '#f8fafc',
    backgroundGradient: ['#f8fafc', '#f1f5f9', '#e2e8f0'],
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    pressedBackgroundColor: 'rgba(99, 102, 241, 0.15)',
    textColor: '#0f172a',
    highlightColor: '#4f46e5',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    blurIntensity: 25,
    blurTint: 'light',
    rippleColor: 'rgba(79, 70, 229, 0.15)',
    shadow: {
      shadowColor: '#64748b',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 3,
    },
  },
  apple: {
    id: 'apple',
    type: 'glass',
    screenBackground: '#1c1c1e',
    backgroundGradient: ['#2c1654', '#ff416c', '#ff4b2b'],
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    pressedBackgroundColor: 'rgba(255, 255, 255, 0.26)',
    textColor: '#ffffff',
    highlightColor: '#0a84ff',
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 24,
    borderWidth: 1,
    blurIntensity: 65,
    blurTint: 'light',
    rippleColor: 'rgba(255, 255, 255, 0.15)',
    shadow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 14,
      elevation: 6,
    },
  },
  windows: {
    id: 'windows',
    type: 'glass',
    screenBackground: '#111827',
    backgroundGradient: ['#001f3f', '#003366', '#0078d4'],
    backgroundColor: 'rgba(32, 32, 32, 0.55)',
    pressedBackgroundColor: 'rgba(60, 60, 60, 0.7)',
    textColor: '#f3f4f6',
    highlightColor: '#60cdff',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 12,
    borderWidth: 1,
    blurIntensity: 50,
    blurTint: 'dark',
    rippleColor: 'rgba(96, 205, 255, 0.2)',
    shadow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 5,
    },
  },
  steam: {
    id: 'steam',
    type: 'solid',
    screenBackground: '#171a21',
    backgroundGradient: ['#171a21', '#1b2838'],
    backgroundColor: '#1b2838',
    pressedBackgroundColor: '#2a475e',
    textColor: '#c7d5e0',
    highlightColor: '#66c0f4',
    borderColor: '#2a475e',
    borderRadius: 6,
    borderWidth: 2,
    blurIntensity: 0,
    blurTint: 'dark',
    rippleColor: 'rgba(102, 192, 244, 0.25)',
    shadow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 3,
    },
  },
  oneui: {
    id: 'oneui',
    type: 'solid',
    screenBackground: '#000000',
    backgroundGradient: ['#000000', '#0a0a0f'],
    backgroundColor: '#17171a',
    pressedBackgroundColor: '#232328',
    textColor: '#fafaff',
    highlightColor: '#3e8aff',
    borderColor: '#2c2c34',
    borderRadius: 26,
    borderWidth: 1,
    blurIntensity: 0,
    blurTint: 'dark',
    rippleColor: 'rgba(62, 138, 255, 0.22)',
    shadow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },
  },
  chromebook: {
    id: 'chromebook',
    type: 'flat',
    screenBackground: '#202124',
    backgroundGradient: ['#202124', '#292a2d'],
    backgroundColor: '#303134',
    pressedBackgroundColor: '#3c4043',
    textColor: '#e8eaed',
    highlightColor: '#8ab4f8',
    borderColor: '#5f6368',
    borderRadius: 16,
    borderWidth: 0,
    blurIntensity: 0,
    blurTint: 'dark',
    rippleColor: 'rgba(138, 180, 248, 0.18)',
    shadow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 2,
    },
  },
  gamer: {
    id: 'gamer',
    type: 'solid',
    screenBackground: '#090014',
    backgroundGradient: ['#090014', '#1f0033', '#110022'],
    backgroundColor: '#16002b',
    pressedBackgroundColor: '#2d004d',
    textColor: '#00ffcc',
    highlightColor: '#ff007f',
    borderColor: '#ff007f',
    borderRadius: 4,
    borderWidth: 2,
    blurIntensity: 0,
    blurTint: 'dark',
    rippleColor: 'rgba(255, 0, 127, 0.3)',
    shadow: {
      shadowColor: '#ff007f',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  ios: {
    id: 'ios',
    type: 'glass',
    screenBackground: '#1c1c1e',
    backgroundGradient: ['#1c1c1e', '#2c2c2e'],
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    pressedBackgroundColor: 'rgba(255, 255, 255, 0.26)',
    textColor: '#ffffff',
    highlightColor: '#0a84ff',
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 22,
    borderWidth: 1,
    blurIntensity: 60,
    blurTint: 'dark',
    rippleColor: 'rgba(255, 255, 255, 0.15)',
    shadow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
    },
  },
};

export function getSkin(skinName?: string): SkinDefinition {
  if (!skinName) return skins.default;
  const normalized = skinName.toLowerCase().trim() as SkinId;
  return skins[normalized] ?? skins.default;
}
