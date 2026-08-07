import { useState } from 'react';
import { Platform } from 'react-native';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Button } from './Button';
import { notify } from './dialog';
import { colors } from './tokens';

interface Props {
  /** collapsable={false}로 감싼 캡처 대상 View의 ref */
  readonly targetRef: RefObject<View | null>;
  /** 공유 시트에 뜨는 제목 */
  readonly dialogTitle: string;
}

const IS_WEB = Platform.OS === 'web';

/**
 * 결과 카드를 이미지로 캡처해 공유한다.
 * Certificate·TypeCard는 이 버튼과 짝을 이루도록 collapsable={false} View로 감싸져 있다 —
 * 안드로이드는 뷰 트리를 최적화하며 자식이 하나뿐인 View를 접어버릴 수 있는데,
 * 그러면 캡처 대상이 통째로 사라진다.
 *
 * 웹에서는 expo-sharing이 동작하지 않는다(isAvailableAsync가 false). 캡처 자체는
 * 되므로 그 결과를 브라우저 다운로드로 넘긴다 — 그냥 두면 버튼을 눌러도 아무 일도
 * 일어나지 않는 상태가 된다.
 */
export function ShareButton({ targetRef, dialogTitle }: Props) {
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    if (busy || targetRef.current === null) return;
    setBusy(true);
    try {
      const uri = await captureRef(targetRef, { format: 'png', quality: 1 });
      if (IS_WEB) {
        downloadOnWeb(uri, `${dialogTitle}.png`);
        return;
      }
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        notify('공유할 수 없습니다', '이 기기에서는 공유 기능을 지원하지 않습니다.');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle });
    } catch {
      notify(
        IS_WEB ? '이미지를 만들지 못했습니다' : '공유에 실패했습니다',
        '잠시 후 다시 시도해주세요.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      label={busy ? '이미지 만드는 중…' : IS_WEB ? '📥 결과 이미지 저장' : '📤 결과 이미지 공유'}
      color={colors.white}
      onPress={() => void onPress()}
      disabled={busy}
      testID="share-card"
    />
  );
}

/** 웹 전용. 캡처 결과(data URI)를 파일로 내려받게 한다. */
function downloadOnWeb(uri: string, filename: string): void {
  const doc = globalThis.document;
  if (doc === undefined) return;
  const a = doc.createElement('a');
  a.href = uri;
  a.download = filename;
  doc.body.appendChild(a);
  a.click();
  doc.body.removeChild(a);
}
