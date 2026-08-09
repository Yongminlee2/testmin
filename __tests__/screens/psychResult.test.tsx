import React from 'react';
import { render, screen } from '@testing-library/react-native';
import PsychResultScreen from '../../app/test/psych/result';
import { useSession } from '@/store/session';
import { getPsychTest } from '@/content/registry';
import { psychRelationCopy } from '@/content/resultPresentation';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockDismissAll = jest.fn();
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: mockPush, replace: mockReplace, dismissAll: mockDismissAll, back: jest.fn() }),
}));

const love = getPsychTest('love');

beforeEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
  mockDismissAll.mockClear();
  useSession.getState().reset();
});

describe('PsychResultScreen', () => {
  test('연애 성향 테스트가 등록되어 있다', () => {
    expect(love).toBeDefined();
    expect(love?.questions).toHaveLength(12);
    expect(love?.types).toHaveLength(5);
  });

  test('한 유형에 몰아서 답하면 그 유형이 나온다', async () => {
    const test = love!;
    useSession.getState().start('psych', 'love', 1, test.questions);
    // 각 문항에서 flame에 투표하는 선택지를 고른다. 없으면 미응답으로 둔다.
    for (const q of test.questions) {
      const idx = q.choices.findIndex((c) => c.typeId === 'flame');
      if (idx >= 0) useSession.getState().answer(q.id, idx);
    }

    await render(<PsychResultScreen />);
    const flame = test.types.find((t) => t.id === 'flame')!;
    expect(screen.getByText(flame.name)).toBeTruthy();
  });

  test('결과 카드에 득표수가 표시된다', async () => {
    const test = love!;
    useSession.getState().start('psych', 'love', 1, test.questions);
    for (const q of test.questions) {
      const idx = q.choices.findIndex((c) => c.typeId === 'flame');
      if (idx >= 0) useSession.getState().answer(q.id, idx);
    }

    await render(<PsychResultScreen />);
    expect(screen.getByText(/12문항 중 \d+표/)).toBeTruthy();
  });

  // 성격 16유형 고사에만 있던 궁합 카드를 심리 테스트에도 붙였다. 득표형은 4글자
  // 코드가 아니라 유형 id라서 배선이 personality와는 다르게 짜여 있으므로,
  // 실제로 이긴 유형의 goodWith·hardWith·rule이 화면에 그대로 나오는지 직접 본다.
  test('이긴 유형의 궁합(잘 맞는 유형·규칙·안내 문구)이 뜬다', async () => {
    const test = love!;
    useSession.getState().start('psych', 'love', 1, test.questions);
    for (const q of test.questions) {
      const idx = q.choices.findIndex((c) => c.typeId === 'flame');
      if (idx >= 0) useSession.getState().answer(q.id, idx);
    }

    await render(<PsychResultScreen />);
    const flame = test.types.find((t) => t.id === 'flame')!;
    expect(flame.goodWith).toHaveLength(2);

    for (const g of flame.goodWith) {
      const goodType = test.types.find((t) => t.id === g.code)!;
      expect(screen.getByText(goodType.name)).toBeTruthy();
      expect(screen.getByText(g.why)).toBeTruthy();
    }
    const hardType = test.types.find((t) => t.id === flame.hardWith.code)!;
    expect(screen.getByText(hardType.name)).toBeTruthy();
    expect(screen.getByText(flame.hardWith.why)).toBeTruthy();

    expect(screen.getByTestId('compat-rule')).toBeTruthy();
    expect(screen.getByText(test.compatRule)).toBeTruthy();
    expect(screen.getByTestId('compat-disclaimer')).toBeTruthy();
  });

  // 세 심리 테스트 전부가 실제로 배선됐는지 — 하나만 확인하면 stress·comm의
  // compatRule이 비거나 types에 goodWith가 빠져도 못 잡는다.
  test.each(['love', 'stress', 'comm', 'recharge', 'procrastination', 'travel'])(
    '%s 테스트도 궁합 카드가 뜬다',
    async (id) => {
      const test = getPsychTest(id)!;
      useSession.getState().start('psych', id, 1, test.questions);
      const firstType = test.types[0]!.id;
      for (const q of test.questions) {
        const idx = q.choices.findIndex((c) => c.typeId === firstType);
        if (idx >= 0) useSession.getState().answer(q.id, idx);
      }

      await render(<PsychResultScreen />);
      expect(screen.getByTestId('compat-rule')).toBeTruthy();
      expect(screen.getByText(test.compatRule)).toBeTruthy();
      expect(screen.getByText(psychRelationCopy(id).goodHeading)).toBeTruthy();
    }
  );

  test('세션이 비어 있으면 크래시하지 않는다', async () => {
    await render(<PsychResultScreen />);
    expect(screen.getByText('결과가 없습니다')).toBeTruthy();
  });
});
