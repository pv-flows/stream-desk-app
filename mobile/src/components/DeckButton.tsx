import { BlurView } from 'expo-blur';
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

export { DeckButtonItem };

interface DeckButtonProps {
  item: DeckButtonItem;
  onPress: (item: DeckButtonItem) => void;
}

export const DeckButton: React.FC<DeckButtonProps> = ({ item, onPress }) => {
  const theme = useThemeStore((state) => state.theme);
  const skin = getSkin(theme);

  const scale = useSharedValue(1);
  const pressProgress = useSharedValue(0);
  const elevationAnim = useSharedValue(skin.shadow.elevation);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);

  const baseBorderColor = item.color || skin.borderColor;
  const activeAccentColor = item.color || skin.highlightColor;

  const handlePressIn = () => {
    if (theme === 'apple' || theme === 'windows' || theme === 'ios') {
      // Física de mola na escala para temas glass (Apple / Windows)
      scale.value = withSpring(0.92, {
        damping: 12,
        stiffness: 220,
      });
      pressProgress.value = withTiming(1, { duration: 120 });
    } else if (theme === 'steam') {
      // Corte seco invertendo cor de borda/fundo sem redução de escala
      scale.value = 1;
      pressProgress.value = withTiming(1, { duration: 40 });
    } else if (theme === 'oneui' || theme === 'chromebook') {
      // Ripple suave e alteração de sombra/elevação
      scale.value = withTiming(0.97, { duration: 130 });
      pressProgress.value = withTiming(1, { duration: 130 });
      elevationAnim.value = withTiming(skin.shadow.elevation + 6, { duration: 130 });
      rippleScale.value = 0.2;
      rippleOpacity.value = 0.85;
      rippleScale.value = withTiming(2.4, { duration: 320 });
    } else {
      // Default / Gamer
      scale.value = withSpring(0.94, { damping: 14, stiffness: 200 });
      pressProgress.value = withTiming(1, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (theme === 'apple' || theme === 'windows' || theme === 'ios') {
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 220,
      });
      pressProgress.value = withTiming(0, { duration: 150 });
    } else if (theme === 'steam') {
      scale.value = 1;
      pressProgress.value = withTiming(0, { duration: 40 });
    } else if (theme === 'oneui' || theme === 'chromebook') {
      scale.value = withTiming(1, { duration: 160 });
      pressProgress.value = withTiming(0, { duration: 160 });
      elevationAnim.value = withTiming(skin.shadow.elevation, { duration: 160 });
      rippleOpacity.value = withTiming(0, { duration: 220 });
    } else {
      scale.value = withSpring(1, { damping: 14, stiffness: 200 });
      pressProgress.value = withTiming(0, { duration: 140 });
    }
  };

  const animatedContainerStyle = useAnimatedStyle(() => {
    const backgroundColor =
      skin.type === 'glass'
        ? skin.backgroundColor
        : interpolateColor(
            pressProgress.value,
            [0, 1],
            [skin.backgroundColor, theme === 'steam' ? activeAccentColor : skin.pressedBackgroundColor]
          );

    const borderColor = interpolateColor(
      pressProgress.value,
      [0, 1],
      [baseBorderColor, theme === 'steam' ? skin.backgroundColor : activeAccentColor]
    );

    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
      borderColor,
      elevation: elevationAnim.value,
      shadowOpacity:
        theme === 'oneui' || theme === 'chromebook'
          ? skin.shadow.shadowOpacity + pressProgress.value * 0.2
          : skin.shadow.shadowOpacity,
    };
  }, [skin, theme, baseBorderColor, activeAccentColor]);

  const animatedRippleStyle = useAnimatedStyle(() => ({
    opacity: rippleOpacity.value,
    transform: [{ scale: rippleScale.value }],
  }));

  const isRippleTheme = theme === 'oneui' || theme === 'chromebook';

  return (
    <Pressable
      onPress={() => onPress(item)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={
        isRippleTheme ? { color: skin.rippleColor, borderless: false } : undefined
      }
      style={styles.pressableWrapper}
    >
      <Animated.View
        style={[
          styles.button,
          {
            borderRadius: skin.borderRadius,
            borderWidth: skin.borderWidth,
            shadowColor: skin.shadow.shadowColor,
            shadowOffset: skin.shadow.shadowOffset,
            shadowRadius: skin.shadow.shadowRadius,
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

        {isRippleTheme ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.rippleCircle,
              { backgroundColor: skin.rippleColor },
              animatedRippleStyle,
            ]}
          />
        ) : null}

        <View style={styles.contentContainer}>
          {item.icon ? (
            <Text style={[styles.icon, { color: activeAccentColor }]}>{item.icon}</Text>
          ) : null}
          <Text style={[styles.label, { color: skin.textColor }]} numberOfLines={2}>
            {item.label}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressableWrapper: {
    width: '28%',
    aspectRatio: 1,
    margin: '2%',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    overflow: 'hidden',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  rippleCircle: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    zIndex: 1,
  },
  icon: {
    fontSize: 24,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
