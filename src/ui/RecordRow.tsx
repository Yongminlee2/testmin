import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from './Card';
import { InteractivePressable } from './InteractivePressable';
import { space } from './tokens';

interface Props {
  /** 있으면 눌러서 펼치고 접는 줄이 된다(오답노트). 없으면 고정된 줄이다(성적표). */
  readonly onPress?: () => void;
  /** onPress가 있을 때만 의미가 있다 — 스크린 리더에 펼침 상태를 알린다. */
  readonly expanded?: boolean;
  readonly testID?: string;
  readonly children: React.ReactNode;
}

/**
 * 성적표·오답노트가 함께 쓰는 한 줄 카드 껍데기. Card는 testID를 받지 않으므로
 * (그 계약을 여기서 새로 만들지 않는다) 바깥에 testID를 가진 View/Pressable을
 * 하나 더 두는 방식으로 querying 지점을 만든다. 내용은 화면마다 다르다.
 */
export function RecordRow({ onPress, expanded, testID, children }: Props) {
  if (onPress === undefined) {
    return (
      <View testID={testID} style={styles.row}>
        <Card>{children}</Card>
      </View>
    );
  }

  return (
    <InteractivePressable
      testID={testID}
      style={styles.row}
      accessibilityRole="button"
      accessibilityState={{ expanded: expanded ?? false }}
      onPress={onPress}
    >
      <Card>{children}</Card>
    </InteractivePressable>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: space.md },
});
