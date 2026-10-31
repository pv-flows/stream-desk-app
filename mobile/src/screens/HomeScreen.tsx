import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { DeckButtonItem } from '../components/DeckButton';
import { DeckGrid } from '../components/DeckGrid';
import { useThemeStore } from '../store/themeStore';
import { ThemeName } from '../theme/colors';

const INITIAL_BUTTONS: DeckButtonItem[] = [
  { id: '1', label: 'Mute Mic', action: 'AUDIO_MUTE_MIC', icon: '🎙️' },
  { id: '2', label: 'Play / Pause', action: 'MEDIA_PLAY_PAUSE', icon: '⏯️' },
  { id: '3', label: 'Next Track', action: 'MEDIA_NEXT', icon: '⏭️' },
  { id: '4', label: 'OBS Scene 1', action: 'OBS_SCENE_1', icon: '🎬' },
  { id: '5', label: 'Screenshot', action: 'SYSTEM_SCREENSHOT', icon: '📸' },
  { id: '6', label: 'Open Browser', action: 'APP_OPEN_BROWSER', icon: '🌐' },
  { id: '7', label: 'Volume +', action: 'AUDIO_VOL_UP', icon: '🔊' },
  { id: '8', label: 'Volume -', action: 'AUDIO_VOL_DOWN', icon: '🔉' },
  { id: '9', label: 'Lock PC', action: 'SYSTEM_LOCK', icon: '🔒' },
];

const THEME_OPTIONS: ThemeName[] = ['default', 'ios', 'windows', 'gamer'];

export const HomeScreen: React.FC = () => {
  const { theme, palette, setTheme } = useThemeStore();
  const [lastAction, setLastAction] = useState<string>('Aguardando comando...');

  const handleButtonPress = (item: DeckButtonItem) => {
    setLastAction(`Comando: ${item.label} (${item.action})`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.textColor }]}>Stream Desk</Text>
        <Text style={[styles.subtitle, { color: palette.highlight }]}>{lastAction}</Text>
      </View>

      <View style={styles.gridContainer}>
        <DeckGrid buttons={INITIAL_BUTTONS} onButtonPress={handleButtonPress} />
      </View>

      <View style={[styles.footer, { borderTopColor: palette.borderColor }]}>
        <Text style={[styles.footerLabel, { color: palette.textColor }]}>Tema:</Text>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((option) => {
            const isSelected = theme === option;
            return (
              <Pressable
                key={option}
                onPress={() => setTheme(option)}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: isSelected ? palette.highlight : palette.buttonBackground,
                    borderColor: palette.borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    { color: isSelected ? '#000000' : palette.textColor },
                  ]}
                >
                  {option.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 32,
    paddingBottom: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  themeButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
