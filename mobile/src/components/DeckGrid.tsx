import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DeckButton, DeckButtonItem } from './DeckButton';

interface DeckGridProps {
  buttons: DeckButtonItem[];
  onButtonPress: (item: DeckButtonItem) => void;
}

export const DeckGrid: React.FC<DeckGridProps> = ({ buttons, onButtonPress }) => {
  return (
    <View style={styles.grid}>
      {buttons.map((item) => (
        <DeckButton key={item.id} item={item} onPress={onButtonPress} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 12,
  },
});

