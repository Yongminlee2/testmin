import React from 'react';
import { render, screen } from '@testing-library/react-native';
import PsychResultScreen from '../../app/test/psych/result';
import { useSession } from '@/store/session';
import { getPsychTest } from '@/content/registry';

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

  test('세션이 비어 있으면 크래시하지 않는다', async () => {
    await render(<PsychResultScreen />);
    expect(screen.getByText('결과가 없습니다')).toBeTruthy();
  });
});
