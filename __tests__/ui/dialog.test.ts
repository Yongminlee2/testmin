import { Alert, Platform } from 'react-native';
import { confirmDestructive, notify } from '@/ui/dialog';

/**
 * 웹에서 안내·확인창이 실제로 뜨는지 지킨다.
 *
 * react-native-web의 Alert는 조용히 아무것도 하지 않는다. 그대로 쓰면
 * "준비 중입니다" 안내가 사라지고, 기록 삭제 확인창이 안 떠서 삭제 버튼이
 * 눌리기만 하고 아무 일도 안 일어난다 — 화면만 봐서는 알아채기 어려운 결함이라
 * 테스트로 못 박아 둔다.
 */

const realOS = Platform.OS;
const realAlert = globalThis.alert;
const realConfirm = globalThis.confirm;

function setPlatform(os: string): void {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
}

let alertSpy: jest.SpyInstance;

beforeEach(() => {
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => {
  setPlatform(realOS);
  globalThis.alert = realAlert;
  globalThis.confirm = realConfirm;
  alertSpy.mockRestore();
});

describe('notify', () => {
  test('웹에서는 브라우저 alert를 띄운다', () => {
    setPlatform('web');
    const browserAlert = jest.fn();
    globalThis.alert = browserAlert;

    notify('준비 중입니다', '다음 업데이트에 열립니다.');

    expect(browserAlert).toHaveBeenCalledTimes(1);
    const text = String(browserAlert.mock.calls[0]?.[0]);
    expect(text).toContain('준비 중입니다');
    expect(text).toContain('다음 업데이트에 열립니다.');
    // 웹에서 RN Alert로 새면 사용자에게 아무것도 안 보인다
    expect(alertSpy).not.toHaveBeenCalled();
  });

  test('안드로이드에서는 RN Alert를 쓴다', () => {
    setPlatform('android');
    const browserAlert = jest.fn();
    globalThis.alert = browserAlert;

    notify('준비 중입니다', '다음 업데이트에 열립니다.');

    expect(alertSpy).toHaveBeenCalledWith('준비 중입니다', '다음 업데이트에 열립니다.');
    expect(browserAlert).not.toHaveBeenCalled();
  });
});

describe('confirmDestructive', () => {
  test('웹에서 확인을 누르면 실행된다', () => {
    setPlatform('web');
    globalThis.confirm = jest.fn(() => true);
    const onConfirm = jest.fn();

    confirmDestructive('기록을 지울까요?', '되돌릴 수 없습니다.', '지우기', onConfirm);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('웹에서 취소하면 실행되지 않는다', () => {
    setPlatform('web');
    globalThis.confirm = jest.fn(() => false);
    const onConfirm = jest.fn();

    confirmDestructive('기록을 지울까요?', '되돌릴 수 없습니다.', '지우기', onConfirm);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('안드로이드에서는 확인 버튼을 눌러야 실행된다', () => {
    setPlatform('android');
    const onConfirm = jest.fn();

    confirmDestructive('기록을 지울까요?', '되돌릴 수 없습니다.', '지우기', onConfirm);

    const buttons = alertSpy.mock.calls[0]?.[2] as
      | Array<{ text: string; onPress?: () => void }>
      | undefined;
    expect(buttons?.map((b) => b.text)).toEqual(['취소', '지우기']);
    expect(onConfirm).not.toHaveBeenCalled();

    buttons?.find((b) => b.text === '지우기')?.onPress?.();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
