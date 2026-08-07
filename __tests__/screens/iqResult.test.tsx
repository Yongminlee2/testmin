import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import IqResultScreen from '../../app/test/iq/result';
import { useSession } from '@/store/session';
import { shape } from '@/engine/iq/figure';
import type { FigureSpec, Question } from '@/engine/types';

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

function single(): FigureSpec {
  return { kind: 'single', cells: [{ shapes: [shape('circle')] }] };
}

function q(id: string, answerIndex: number): Question {
  return {
    id,
    kind: 'scored',
    prompt: `${id} 질문`,
    figure: single(),
    choices: [{ figure: single() }, { figure: single() }, { figure: single() }, { figure: single() }],
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

describe('IqResultScreen', () => {
  // ★ 점수만 있고 문구가 없는 화면이 나가는 걸 막는 유일한 장치.
  test('점수를 보여주는 화면은 안내 문구도 보여준다', async () => {
    useSession.getState().start('iq', 'default', 1, questions);
    useSession.getState().answer('a', 0);
    useSession.getState().answer('b', 1);
    useSession.getState().answer('c', 2);
    useSession.getState().answer('d', 3);

    await render(<IqResultScreen />);
    expect(screen.getByTestId('iq-score')).toBeTruthy();
    expect(screen.getByTestId('iq-disclaimer')).toBeTruthy();
  });

  test('만점이면 추정 점수가 145다', async () => {
    useSession.getState().start('iq', 'default', 1, questions);
    useSession.getState().answer('a', 0);
    useSession.getState().answer('b', 1);
    useSession.getState().answer('c', 2);
    useSession.getState().answer('d', 3);

    await render(<IqResultScreen />);
    expect(screen.getByTestId('iq-score').props.children.join('')).toContain('145');
  });

  test('세션이 비어 있으면 크래시하지 않는다', async () => {
    await render(<IqResultScreen />);
    expect(screen.getByText('결과가 없습니다')).toBeTruthy();
  });

  test('홈으로 버튼은 스택 전체를 정리하고 홈으로 돌아간다', async () => {
    useSession.getState().start('iq', 'default', 1, questions);
    await render(<IqResultScreen />);
    await fireEvent.press(screen.getByTestId('go-home'));
    expect(mockDismissAll).toHaveBeenCalled();
  });

  test('다시 응시 버튼을 누르면 새 문제로 재시작한다', async () => {
    useSession.getState().start('iq', 'default', 1, questions);
    await render(<IqResultScreen />);
    await fireEvent.press(screen.getByTestId('retry'));
    expect(mockReplace).toHaveBeenCalledWith('/test/iq/quiz');
    expect(useSession.getState().questions.length).toBeGreaterThan(0);
  });
});
