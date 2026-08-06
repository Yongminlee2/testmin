import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ResultScreen from '../../app/test/dialect/result';
import { useSession } from '@/store/session';
import type { Question } from '@/engine/types';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockDismissAll = jest.fn();
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    dismissAll: mockDismissAll,
  }),
}));

function q(id: string, answerIndex: number): Question {
  return {
    id,
    kind: 'scored',
    prompt: `${id} 질문`,
    choices: [{ text: 'ㄱ' }, { text: 'ㄴ' }, { text: 'ㄷ' }, { text: 'ㄹ' }],
    answerIndex,
    explanation: `${id} 해설`,
    difficulty: 1,
  };
}

const questions = [q('a', 0), q('b', 1), q('c', 2), q('d', 3)];

beforeEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
  mockDismissAll.mockClear();
  useSession.getState().reset();
});

describe('ResultScreen', () => {
  test('만점이면 1급과 칭호를 보여준다', async () => {
    useSession.getState().start('dialect', 'gyeongsang', 1, questions);
    useSession.getState().answer('a', 0);
    useSession.getState().answer('b', 1);
    useSession.getState().answer('c', 2);
    useSession.getState().answer('d', 3);

    await render(<ResultScreen />);
    expect(screen.getByText('1급')).toBeTruthy();
    expect(screen.getByText('부산 이모 인정')).toBeTruthy();
  });

  test('맞힌 개수와 총 개수를 보여준다', async () => {
    useSession.getState().start('dialect', 'gyeongsang', 1, questions);
    useSession.getState().answer('a', 0);
    useSession.getState().answer('b', 0);
    useSession.getState().answer('c', 0);
    useSession.getState().answer('d', 0);

    await render(<ResultScreen />);
    expect(screen.getByText('4문항 중 1문항 정답')).toBeTruthy();
  });

  test('0점이면 최하 급수를 보여준다', async () => {
    useSession.getState().start('dialect', 'gyeongsang', 1, questions);
    useSession.getState().answer('a', 1);
    useSession.getState().answer('b', 0);
    useSession.getState().answer('c', 0);
    useSession.getState().answer('d', 0);

    await render(<ResultScreen />);
    expect(screen.getByText('9급')).toBeTruthy();
  });

  test('세션이 비어 있으면 크래시하지 않는다', async () => {
    await render(<ResultScreen />);
    expect(screen.getByText('결과가 없습니다')).toBeTruthy();
  });

  test('다시 응시 버튼은 새 문제를 약속하지 않는다', async () => {
    useSession.getState().start('dialect', 'gyeongsang', 1, questions);
    await render(<ResultScreen />);
    expect(screen.getByText('↻ 다시 응시')).toBeTruthy();
    expect(screen.queryByText('↻ 다시 응시 (새 문제)')).toBeNull();
  });

  test('홈으로 버튼은 스택 전체를 정리하고 홈으로 돌아간다', async () => {
    useSession.getState().start('dialect', 'gyeongsang', 1, questions);
    await render(<ResultScreen />);
    await fireEvent.press(screen.getByTestId('go-home'));
    expect(mockDismissAll).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalledWith('/');
  });
});
