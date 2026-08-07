import { useState } from 'react';
import { Alert } from 'react-native';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Button } from './Button';
import { colors } from './tokens';

interface Props {
  /** collapsable={false}로 감싼 캡처 대상 View의 ref */
  readonly targetRef: RefObject<View | null>;
  /** 공유 시트에 뜨는 제목 */
  readonly dialogTitle: string;
}

/**
 * 결과 카드를 이미지로 캡처해 공유 시트를 연다.
 * Certificate·TypeCard는 이 버튼과 짝을 이루도록 collapsable={false} View로 감싸져 있다 —
 * 안드로이드는 뷰 트리를 최적화하며 자식이 하나뿐인 View를 접어버릴 수 있는데,
 * 그러면 캡처 대상이 통째로 사라진다.
 */
export function ShareButton({ targetRef, dialogTitle }: Props) {
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    if (busy || targetRef.current === null) return;
    setBusy(true);
    try {
      const uri = await captureRef(targetRef, { format: 'png', quality: 1 });
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('공유할 수 없습니다', '이 기기에서는 공유 기능을 지원하지 않습니다.');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle });
    } catch {
      Alert.alert('공유에 실패했습니다', '잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      label={busy ? '이미지 만드는 중…' : '📤 결과 이미지 공유'}
      color={colors.white}
      onPress={() => void onPress()}
      disabled={busy}
      testID="share-card"
    />
  );
}
