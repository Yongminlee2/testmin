import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../../app/(tabs)/settings';
import { privacyPolicyUrl, supportUrl } from '@/appMeta';

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('개인정보와 로컬 저장 상태를 한 화면에서 설명한다', async () => {
    await render(<SettingsScreen />);

    expect(screen.getByText(/계정도 광고도 분석 도구도 없습니다/)).toBeTruthy();
    expect(screen.getByText('응시 기록')).toBeTruthy();
    expect(screen.getByText('오답노트')).toBeTruthy();
    expect(screen.getByTestId('clear-local-data')).toBeDisabled();
  });

  test('개인정보처리방침과 지원 페이지를 외부 링크로 연다', async () => {
    const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await render(<SettingsScreen />);

    await fireEvent.press(screen.getByTestId('open-privacy'));
    await fireEvent.press(screen.getByTestId('open-support'));

    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(privacyPolicyUrl);
      expect(openSpy).toHaveBeenCalledWith(supportUrl);
    });
  });
});
