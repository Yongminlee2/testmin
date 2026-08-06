import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radius as radiusToken } from './tokens';

interface Props {
  readonly offset?: number;
  readonly radius?: number;
  readonly style?: ViewStyle;
  readonly children: React.ReactNode;
}

/**
 * 네오브루탈 하드 섀도우.
 * RN의 elevation은 부드러운 그림자라 톤이 안 나오므로,
 * 뒤에 같은 모양의 검정 View를 오프셋만큼 밀어 깐다.
 * Android 8부터 최신까지, iOS까지 동일하게 보인다.
 */
export function HardShadow({
  offset = 3,
  radius = radiusToken.card,
  style,
  children,
}: Props) {
  return (
    <View style={style}>
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: colors.ink,
            borderRadius: radius,
            transform: [{ translateX: offset }, { translateY: offset }],
          },
        ]}
      />
      {children}
    </View>
  );
}
