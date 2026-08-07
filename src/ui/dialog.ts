import { Alert, Platform } from 'react-native';

/**
 * 안내·확인 대화상자. 웹에서도 실제로 뜨게 하려고 한 겹 감싼다.
 *
 * react-native-web의 Alert는 아무것도 하지 않는다(개발 콘솔에만 찍힌다).
 * 그대로 두면 웹에서 "준비 중입니다" 안내가 통째로 사라지고, 더 나쁘게는
 * 기록 삭제 확인창이 안 떠서 삭제 버튼이 먹통이 된다 — 화면상으론 눌리는데
 * 아무 일도 안 일어나는 상태다.
 */

export function notify(title: string, message: string): void {
  if (Platform.OS === 'web') {
    globalThis.alert?.(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

/** 되돌릴 수 없는 동작의 확인창. 확인을 누른 경우에만 onConfirm이 불린다. */
export function confirmDestructive(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void
): void {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`) === true) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: '취소', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
