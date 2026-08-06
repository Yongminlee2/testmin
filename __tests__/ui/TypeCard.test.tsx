import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { TypeCard } from '@/ui/TypeCard';
import type { AxisScore } from '@/engine/types';

const axes: AxisScore[] = [
  { axis: 'EI', total: 6, letter: 'E', percent: 90, wasTie: false },
  { axis: 'SN', total: 0, letter: 'S', percent: 50, wasTie: true },
  { axis: 'TF', total: -4, letter: 'T', percent: 78, wasTie: false },
  { axis: 'JP', total: 2, letter: 'P', percent: 60, wasTie: false },
];

describe('TypeCard', () => {
  test('라벨·큰글씨·별명·설명을 보여준다', async () => {
    await render(
      <TypeCard
        label="성격 16유형 고사"
        headline="ENFP"
        nickname="판 벌이고 수습 안 하는 사람"
        description="아이디어는 열 개, 완성은 한 개."
      />
    );
    expect(screen.getByText('성격 16유형 고사')).toBeTruthy();
    expect(screen.getByText('ENFP')).toBeTruthy();
    expect(screen.getByText('판 벌이고 수습 안 하는 사람')).toBeTruthy();
    expect(screen.getByText('아이디어는 열 개, 완성은 한 개.')).toBeTruthy();
  });

  test('축이 없으면 막대를 그리지 않는다', async () => {
    await render(
      <TypeCard label="심리 테스트" headline="🔥" nickname="직진형" description="좋으면 바로 말합니다." />
    );
    expect(screen.queryByText('이 축은 거의 반반입니다')).toBeNull();
  });

  test('축이 있으면 여덟 글자가 모두 나온다', async () => {
    await render(
      <TypeCard
        label="성격 16유형 고사"
        headline="ESTP"
        nickname="일단 지르고 보는 사람"
        description="고민하는 시간에 이미 해버립니다."
        axes={axes}
      />
    );
    for (const letter of ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P']) {
      expect(screen.getAllByText(letter).length).toBeGreaterThan(0);
    }
  });

  test('동점인 축에만 "거의 반반" 안내가 붙는다', async () => {
    await render(
      <TypeCard
        label="성격 16유형 고사"
        headline="ESTP"
        nickname="일단 지르고 보는 사람"
        description="고민하는 시간에 이미 해버립니다."
        axes={axes}
      />
    );
    expect(screen.getAllByText('이 축은 거의 반반입니다')).toHaveLength(1);
  });

  test('note를 주면 보여준다', async () => {
    await render(
      <TypeCard label="L" headline="H" nickname="N" description="D" note="메모입니다" />
    );
    expect(screen.getByText('메모입니다')).toBeTruthy();
  });

  test('note를 안 주면 보이지 않는다', async () => {
    await render(<TypeCard label="L" headline="H" nickname="N" description="D" />);
    expect(screen.queryByText('메모입니다')).toBeNull();
  });
});
