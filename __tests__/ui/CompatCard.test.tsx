import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { CompatCard } from '@/ui/CompatCard';

/**
 * CompatCard는 성격 16유형과 심리 테스트 3종이 공유하는 컴포넌트다. 궁합은 정답이
 * 없는 값이라, 이 앱의 원칙(정답에는 항상 이유가 붙는다)이 여기서는 다른 형태로
 * 나타난다 — (1) rule로 판정 기준을 밝히고, (2) 안내 문구를 항상 같이 띄운다.
 * 둘 중 하나라도 빠지면 근거 없는 단정이 되므로, 그 두 가지가 항상 나오는지는
 * 이 컴포넌트 하나만 지키면 personality·psych 네 화면 전부가 지켜진다.
 */
describe('CompatCard', () => {
  const goodWith = [
    { label: 'ENTP', sub: '별명A', why: '이유A' },
    { label: 'INTP', sub: '별명B', why: '이유B' },
  ];
  const hardWith = { label: 'ESFP', sub: '별명C', why: '이유C' };

  test('규칙(rule)과 안내 문구가 항상 함께 뜬다', async () => {
    await render(<CompatCard goodWith={goodWith} hardWith={hardWith} rule="판정 기준 문구" />);
    expect(screen.getByTestId('compat-rule')).toBeTruthy();
    expect(screen.getByText('판정 기준 문구')).toBeTruthy();
    expect(screen.getByTestId('compat-disclaimer')).toBeTruthy();
  });

  test('goodWith 항목의 이름·별명·이유가 모두 보인다', async () => {
    await render(<CompatCard goodWith={goodWith} hardWith={hardWith} rule="규칙" />);
    for (const g of goodWith) {
      expect(screen.getByText(g.label)).toBeTruthy();
      expect(screen.getByText(g.sub)).toBeTruthy();
      expect(screen.getByText(g.why)).toBeTruthy();
    }
  });

  test('hardWith 항목의 이름·별명·이유가 보인다', async () => {
    await render(<CompatCard goodWith={goodWith} hardWith={hardWith} rule="규칙" />);
    expect(screen.getByText(hardWith.label)).toBeTruthy();
    expect(screen.getByText(hardWith.sub)).toBeTruthy();
    expect(screen.getByText(hardWith.why)).toBeTruthy();
  });

  // hardWith가 없는 경우(계산 실패 등)에도 goodWith와 안내 문구는 그대로 떠야 한다.
  test('hardWith가 없어도 크래시하지 않고 나머지는 보인다', async () => {
    await render(<CompatCard goodWith={goodWith} rule="규칙" />);
    expect(screen.getByText(goodWith[0]!.label)).toBeTruthy();
    expect(screen.getByTestId('compat-disclaimer')).toBeTruthy();
    expect(screen.queryByText(hardWith.label)).toBeNull();
  });

  test('goodWith가 비어 있어도 크래시하지 않는다', async () => {
    await render(<CompatCard goodWith={[]} rule="규칙" />);
    expect(screen.getByTestId('compat-rule')).toBeTruthy();
  });
});
