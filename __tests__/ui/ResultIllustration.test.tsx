import React from 'react';
import { render, screen } from '@testing-library/react-native';
import {
  ResultIllustration,
  WEB_RESULT_CARD_MAX_WIDTH,
  WEB_RESULT_ILLUSTRATION_MAX_WIDTH,
  resultCardMaxWidth,
  resultIllustrationMaxWidth,
} from '@/ui/ResultIllustration';
import { borderWidth, space } from '@/ui/tokens';

describe('ResultIllustration', () => {
  test('웹에서만 결과 일러스트의 최대 폭을 제한한다', () => {
    expect(resultIllustrationMaxWidth('web')).toBe(WEB_RESULT_ILLUSTRATION_MAX_WIDTH);
    expect(resultIllustrationMaxWidth('android')).toBeUndefined();
    expect(resultIllustrationMaxWidth('ios')).toBeUndefined();
  });

  test('웹 결과 카드의 안쪽 폭은 일러스트 폭과 정확히 일치한다', () => {
    expect(WEB_RESULT_CARD_MAX_WIDTH).toBe(
      WEB_RESULT_ILLUSTRATION_MAX_WIDTH + (space.md + borderWidth.card) * 2
    );
    expect(resultCardMaxWidth('web')).toBe(WEB_RESULT_CARD_MAX_WIDTH);
    expect(resultCardMaxWidth('android')).toBeUndefined();
    expect(resultCardMaxWidth('ios')).toBeUndefined();
  });

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
        journal={{
          title: '교정실 리포트',
          habitLabel: '이번 원고 장면',
          charmLabel: '이미 잡은 감각',
          tipLabel: '다음 한 문장',
          disclaimer: '맞춤법 실수는 실력 전체가 아니에요.',
        }}
      />
    );

    expect(screen.getByText('웃기는 한 줄')).toBeTruthy();
    expect(screen.getByText('교정실 리포트')).toBeTruthy();
    expect(screen.getByText('이번 원고 장면')).toBeTruthy();
    expect(screen.getByText('이미 잡은 감각')).toBeTruthy();
    expect(screen.getByText('다음 한 문장')).toBeTruthy();
    expect(screen.getByText(/맞춤법 실수는 실력 전체가 아니에요/)).toBeTruthy();
  });
});
