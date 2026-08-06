import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { borderWidth, colors, font, radius, space } from './tokens';

interface Props {
  readonly label: string;
  readonly color?: string;
}

export function Badge({ label, color = colors.white }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text} maxFontSizeMultiplier={font.maxScale}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  text: {
    color: colors.ink,
    fontSize: font.size.caption,
    fontFamily: font.family.bold,
  },
});
