import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { HardShadow } from './HardShadow';
import { InteractivePressable } from './InteractivePressable';
import { borderWidth, colors, font, radius, space } from './tokens';

interface Props {
  readonly label: string;
  readonly onPress: () => void;
  readonly color?: string;
  readonly disabled?: boolean;
  readonly testID?: string;
}

export function Button({
  label,
  onPress,
  color = colors.white,
  disabled = false,
  testID,
}: Props) {
  return (
    <HardShadow offset={disabled ? 0 : 3} radius={radius.button} style={styles.wrap}>
      <InteractivePressable
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={[
          styles.button,
          { backgroundColor: disabled ? '#E8E8E8' : color },
        ]}
      >
        <Text
          style={styles.label}
          maxFontSizeMultiplier={font.maxScale}
          numberOfLines={2}
        >
          {label}
        </Text>
      </InteractivePressable>
    </HardShadow>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderWidth: borderWidth.card,
    borderColor: colors.ink,
    borderRadius: radius.button,
  },
  label: {
    color: colors.ink,
    fontSize: font.size.body,
    fontFamily: font.family.black,
    textAlign: 'center',
  },
});
