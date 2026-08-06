import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { HardShadow } from './HardShadow';
import { borderWidth, colors, radius as radiusToken, space } from './tokens';

interface Props {
  readonly color?: string;
  readonly radius?: number;
  readonly offset?: number;
  readonly style?: ViewStyle;
  readonly children: React.ReactNode;
}

export function Card({
  color = colors.white,
  radius = radiusToken.card,
  offset = 3,
  style,
  children,
}: Props) {
  return (
    <HardShadow offset={offset} radius={radius} style={style}>
      <View
        style={[
          styles.card,
          { backgroundColor: color, borderRadius: radius },
        ]}
      >
        {children}
      </View>
    </HardShadow>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: borderWidth.card,
    borderColor: colors.ink,
    padding: space.md,
  },
});
