import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import PsychIntroScreen from '../../app/test/psych/intro';
import { useSession } from '@/store/session';
import { getPsychTest } from '@/content/registry';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
}));

beforeEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
  useSession.getState().reset();
});

describe('PsychIntroScreen', () => {
  test('시작하기를 누르면 문항 12개가 원본 순서 그대로 세션에 들어간다', async () => {
    const love = getPsychTest('love')!;

    await render(<PsychIntroScreen />);
    await fireEvent.press(screen.getByTestId('begin'));

    const state = useSession.getState();
    expect(state.testId).toBe('psych');
    expect(state.variant).toBe('love');
    expect(state.questions).toHaveLength(12);
    // 순서까지 비교한다 — id 집합만 같고 순서가 섞였어도 통과하는 검사는
    // 득표 균형(10/10/10/9/9)과 동점 규칙(뒤쪽 문항 우선)이 깨지는 걸 못 잡는다.
    expect(state.questions.map((q) => q.id)).toEqual(love.questions.map((q) => q.id));
  });
});
