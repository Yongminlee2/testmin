import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ResultIllustration } from '@/ui/ResultIllustration';

describe('ResultIllustration', () => {
  test('코믹 캡션과 기분 상하지 않는 상세 관찰일지를 함께 보여준다', async () => {
    await render(
      <ResultIllustration
        source={{ uri: 'comic.webp' }}
        accessibilityLabel="코믹 결과 그림"
        caption="웃기는 한 줄"
        story={{
          habit: '평소에 자주 나오는 귀여운 습관을 장면처럼 길게 설명합니다.',
          charm: '그 습관 안에 숨어 있는 좋은 능력을 다정한 문장으로 설명합니다.',
          tip: '고치라는 명령 대신 다음에 시도할 작은 선택을 부드럽게 제안합니다.',
        }}
      />
    );

    expect(screen.getByText('웃기는 한 줄')).toBeTruthy();
    expect(screen.getByText('📓 코믹 관찰일지')).toBeTruthy();
    expect(screen.getByText('평소 장면')).toBeTruthy();
    expect(screen.getByText('숨은 장점')).toBeTruthy();
    expect(screen.getByText('다음 한 수')).toBeTruthy();
    expect(screen.getByText(/웃자고 만든 관찰일지/)).toBeTruthy();
  });
});
