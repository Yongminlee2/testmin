import React from 'react';
import { render, screen } from '@testing-library/react-native';
import {
  SHARE_COMPAT_IMAGE_SIZE,
  SHARE_COMPAT_WEB_MAX_WIDTH,
  ShareCompatSummary,
  shareCompatMaxWidth,
} from '@/ui/ShareCompatSummary';

describe('ShareCompatSummary', () => {
  const goodWith = [
    { label: 'ENTP', sub: '아이디어 발전소', image: { uri: 'entp.webp' }, accessibilityLabel: 'ENTP 그림' },
    { label: 'INTP', sub: '생각 연구소', image: { uri: 'intp.webp' }, accessibilityLabel: 'INTP 그림' },
  ];
  const hardWith = {
    label: 'ESFP',
    sub: '즉석 런웨이',
    image: { uri: 'esfp.webp' },
    accessibilityLabel: 'ESFP 그림',
  };

  test('공유용 요약에 잘 맞는 둘과 박자를 맞출 하나를 그림과 함께 표시한다', async () => {
    await render(<ShareCompatSummary goodWith={goodWith} hardWith={hardWith} />);

    expect(screen.getByTestId('share-compat-summary')).toBeTruthy();
    expect(screen.getByText('잘 맞는 유형')).toBeTruthy();
    expect(screen.getByText('박자를 맞춰볼 유형')).toBeTruthy();
    expect(screen.getAllByText('티키타카 후보')).toHaveLength(2);
    expect(screen.getByText('통역 한 번 더')).toBeTruthy();
    expect(screen.getByLabelText('ENTP 그림')).toBeTruthy();
    expect(screen.getByLabelText('INTP 그림')).toBeTruthy();
    expect(screen.getByLabelText('ESFP 그림')).toBeTruthy();
  });

  test('표시할 유형이 없으면 빈 영역을 만들지 않는다', async () => {
    await render(<ShareCompatSummary goodWith={[]} />);
    expect(screen.queryByTestId('share-compat-summary')).toBeNull();
  });

  test('좁은 앱에서는 고정 크기 이미지와 세로 행을 쓰고 넓은 웹에서는 전체 폭을 제한한다', async () => {
    await render(<ShareCompatSummary goodWith={goodWith} hardWith={hardWith} />);

    expect(shareCompatMaxWidth('web')).toBe(SHARE_COMPAT_WEB_MAX_WIDTH);
    expect(shareCompatMaxWidth('android')).toBeUndefined();
    expect(screen.getByTestId('share-compat-good-entry-0')).toHaveStyle({ width: '100%' });
    expect(screen.getByTestId('share-compat-good-image-frame-0')).toHaveStyle({
      width: SHARE_COMPAT_IMAGE_SIZE,
      height: SHARE_COMPAT_IMAGE_SIZE,
      flexShrink: 0,
      overflow: 'hidden',
    });
  });
});
