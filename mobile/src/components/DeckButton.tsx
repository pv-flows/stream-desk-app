import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useThemeStore } from '../store/themeStore';

export interface DeckButtonItem {
  id: string;
  label: string;
  action: string;
  icon?: string;
}

interface DeckButtonProps {
  item: DeckButtonItem;
  onPress: (item: DeckButtonItem) => void;
}

export const DeckButton: React.FC<DeckButtonProps> = ({ item, onPress }) => {
  const palette = useThemeStore((state) => state.palette);

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.buttonBackground,
          borderColor: pressed ? palette.highlight : palette.borderColor,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
    >
      {item.icon ? (
        <Text style={[styles.icon, { color: palette.highlight }]}>{item.icon}</Text>
      ) : null}
      <Text style={[styles.label, { color: palette.textColor }]} numberOfLines={2}>
        {item.label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '28%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    margin: '2%',
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

