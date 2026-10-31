import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { DeckButtonItem, useThemeStore } from '../store/themeStore';

export { DeckButtonItem };

interface DeckButtonProps {
  item: DeckButtonItem;
  onPress: (item: DeckButtonItem) => void;
}

export const DeckButton: React.FC<DeckButtonProps> = ({ item, onPress }) => {
  const palette = useThemeStore((state) => state.palette);
  const accentColor = item.color || palette.highlight;

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.buttonBackground,
          borderColor: pressed ? accentColor : item.color || palette.borderColor,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
    >
      {item.icon ? (
        <Text style={[styles.icon, { color: accentColor }]}>{item.icon}</Text>
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
