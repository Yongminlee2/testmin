import React from 'react';
import { render, screen } from '@testing-library/react-native';
import PersonalityResultScreen from '../../app/test/personality/result';
import { useSession } from '@/store/session';
import type { Question } from '@/engine/types';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockDismissAll = jest.fn();
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: mockPush, replace: mockReplace, dismissAll: mockDismissAll, back: jest.fn() }),
}));

function q(id: string, axis: string): Question {
  return {
    id,
    kind: 'typed',
    prompt: `${id} 문항`,
    choices: [
      { text: '매우 그렇다', weight: 2 },
      { text: '그렇다', weight: 1 },
      { text: '아니다', weight: -1 },
      { text: '전혀 아니다', weight: -2 },
    ],
    axis,
    explanation: `${id} 해설`,
    difficulty: 1,
  };
}

const questions = [q('a', 'EI'), q('b', 'SN'), q('c', 'TF'), q('d', 'JP')];

beforeEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
  mockDismissAll.mockClear();
  useSession.getState().reset();
});

describe('PersonalityResultScreen', () => {
  test('모두 양수를 고르면 ENFP와 그 별명이 나온다', async () => {
    useSession.getState().start('personality', 'default', 1, questions);
    for (const x of questions) useSession.getState().answer(x.id, 0);

    await render(<PersonalityResultScreen />);
    expect(screen.getByText('ENFP')).toBeTruthy();
    expect(screen.getByText('판 벌이고 수습 안 하는 사람')).toBeTruthy();
  });

  test('모두 음수를 고르면 ISTJ가 나온다', async () => {
    useSession.getState().start('personality', 'default', 1, questions);
    for (const x of questions) useSession.getState().answer(x.id, 3);

    await render(<PersonalityResultScreen />);
    expect(screen.getByText('ISTJ')).toBeTruthy();
  });

  test('네 축의 글자가 모두 표시된다', async () => {
    useSession.getState().start('personality', 'default', 1, questions);
    for (const x of questions) useSession.getState().answer(x.id, 0);

    await render(<PersonalityResultScreen />);
    for (const letter of ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P']) {
      expect(screen.getAllByText(letter).length).toBeGreaterThan(0);
    }
  });

  test('세션이 비어 있으면 크래시하지 않는다', async () => {
    await render(<PersonalityResultScreen />);
    expect(screen.getByText('결과가 없습니다')).toBeTruthy();
  });
});
