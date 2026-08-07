import { useRef } from 'react';
import { View, Alert } from 'react-native';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ShareButton } from '@/ui/ShareButton';

function Harness() {
  const ref = useRef<View>(null);
  return (
    <View>
      <View ref={ref} collapsable={false} testID="card" />
      <ShareButton targetRef={ref} dialogTitle="테스트 결과" />
    </View>
  );
}

describe('ShareButton', () => {
  afterEach(() => jest.clearAllMocks());

  test('누르면 캡처한 uri로 공유 시트를 연다', async () => {
    await render(<Harness />);
    fireEvent.press(screen.getByTestId('share-card'));

    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalled());

    expect(captureRef).toHaveBeenCalled();
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///mock-capture.png',
      expect.objectContaining({ dialogTitle: '테스트 결과' })
    );
  });

  test('기기가 공유를 지원하지 않으면 안내만 하고 공유를 시도하지 않는다', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    await render(<Harness />);
    fireEvent.press(screen.getByTestId('share-card'));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  test('캡처가 실패해도 크래시하지 않고 안내한다', async () => {
    (captureRef as jest.Mock).mockRejectedValueOnce(new Error('capture failed'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    await render(<Harness />);
    fireEvent.press(screen.getByTestId('share-card'));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });
});
