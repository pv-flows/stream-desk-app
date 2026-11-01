import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { DeckButtonItem, useThemeStore } from '../store/themeStore';
import { getSkin } from '../theme/skins';
import { MobileIcon } from './MobileIcon';

export { DeckButtonItem };

interface DeckButtonProps {
  item: DeckButtonItem;
  onPress: (item: DeckButtonItem) => void;
  buttonWidth?: number | string;
  buttonHeight?: number | string;
}

function resolveAccentColor(colorStr?: string, fallback: string = '#6366f1'): string {
  if (!colorStr) return fallback;
  if (colorStr.startsWith('#') || colorStr.startsWith('rgb')) return colorStr;
  const c = colorStr.toLowerCase();
  if (c.includes('emerald') || c.includes('green')) return '#10b981';
  if (c.includes('amber') || c.includes('yellow') || c.includes('orange')) return '#f59e0b';
  if (c.includes('purple') || c.includes('violet') || c.includes('indigo')) return '#818cf8';
  if (c.includes('rose') || c.includes('red')) return '#f43f5e';
  if (c.includes('blue')) return '#3b82f6';
  if (c.includes('slate') || c.includes('gray')) return '#94a3b8';
  return '#38bdf8';
}

export const DeckButton: React.FC<DeckButtonProps> = ({
  item,
  onPress,
  buttonWidth,
  buttonHeight,
}) => {
  const theme = useThemeStore((state) => state.theme);
  const skin = getSkin(theme);

  const scale = useSharedValue(1);
  const pressProgress = useSharedValue(0);

  const activeAccentColor = resolveAccentColor(item.color, skin.highlightColor);
  const baseBorderColor = item.color ? `${activeAccentColor}44` : skin.borderColor;

  // Tamanho adaptativo do ícone de acordo com o espaço disponível do botão
  const iconSize =
    typeof buttonHeight === 'number'
      ? Math.min(28, Math.max(18, Math.floor(buttonHeight * 0.32)))
      : 26;

  const handlePressIn = () => {
    // Feedback háptico intacto ao toque
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    scale.value = withSpring(0.93, {
      damping: 14,
      stiffness: 240,
    });
    pressProgress.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 14,
      stiffness: 240,
    });
    pressProgress.value = withTiming(0, { duration: 140 });
  };

  const animatedContainerStyle = useAnimatedStyle(() => {
    const backgroundColor =
      skin.type === 'glass'
        ? skin.backgroundColor
        : interpolateColor(
            pressProgress.value,
            [0, 1],
            [skin.backgroundColor, skin.pressedBackgroundColor]
          );

    const borderColor = interpolateColor(
      pressProgress.value,
      [0, 1],
      [baseBorderColor, activeAccentColor]
    );

    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
      borderColor,
    };
  }, [skin, baseBorderColor, activeAccentColor]);

  return (
    <Pressable
      onPress={() => onPress(item)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.pressableWrapper,
        buttonWidth !== undefined && { width: buttonWidth },
        buttonHeight !== undefined
          ? { height: buttonHeight, aspectRatio: undefined }
          : { aspectRatio: 1 },
      ]}
    >
      <Animated.View
        style={[
          styles.button,
          {
            borderRadius: skin.borderRadius,
            borderWidth: skin.borderWidth,
            shadowColor: skin.shadow.shadowColor,
            shadowOffset: skin.shadow.shadowOffset,
            shadowOpacity: skin.shadow.shadowOpacity,
            shadowRadius: skin.shadow.shadowRadius,
            elevation: skin.shadow.elevation,
          },
          animatedContainerStyle,
        ]}
      >
        {skin.type === 'glass' ? (
          <BlurView
            intensity={skin.blurIntensity}
            tint={skin.blurTint}
            style={[StyleSheet.absoluteFill, { borderRadius: skin.borderRadius }]}
          />
        ) : null}

        <View style={styles.contentContainer}>
          <View style={styles.iconWrapper}>
            <MobileIcon
              iconName={item.icon}
              size={iconSize}
              color={activeAccentColor}
            />
          </View>
          <Text
            style={[styles.label, { color: skin.textColor }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {item.label}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressableWrapper: {
    margin: 5,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    overflow: 'hidden',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    gap: 6,
    paddingHorizontal: 4,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    letterSpacing: 0.2,
  },
});
