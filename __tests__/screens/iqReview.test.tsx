import React from 'react';
import { render, screen } from '@testing-library/react-native';
import IqReviewScreen from '../../app/test/iq/review';
import { useSession } from '@/store/session';
import { shape } from '@/engine/iq/figure';
import type { FigureSpec, Question } from '@/engine/types';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
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
    choices: [{ figure: single() }, { figure: single() }, { figure: single() }],
    answerIndex,
    explanation: `${id} 해설`,
    difficulty: 1,
  };
}

const questions = [q('a', 0), q('b', 1), q('c', 2)];

beforeEach(() => {
  useSession.getState().reset();
});

describe('IqReviewScreen', () => {
  test('문항마다 문제 도형과 해설을 보여준다', async () => {
    useSession.getState().start('iq', 'default', 1, questions);
    useSession.getState().answer('a', 0);
    useSession.getState().answer('b', 0);
    useSession.getState().answer('c', 0);

    await render(<IqReviewScreen />);
    expect(screen.getByTestId('review-question-0')).toBeTruthy();
    expect(screen.getByText('a 해설')).toBeTruthy();
  });

  test('맞힌 문항도 내가 고른 것과 정답을 나란히 보여준다', async () => {
    useSession.getState().start('iq', 'default', 1, questions);
    useSession.getState().answer('a', 0); // 정답과 일치

    await render(<IqReviewScreen />);
    expect(screen.getByTestId('review-chosen-0')).toBeTruthy();
    expect(screen.getByTestId('review-answer-0')).toBeTruthy();
  });

  // 미응답(chosenIndex === -1)이면 "응답 없음"을 보여줘야 한다 — 도형 자리가
  // 비어서 크래시하면 안 된다.
  test('응답하지 않은 문항은 "응답 없음"을 보여준다', async () => {
    useSession.getState().start('iq', 'default', 1, questions);
    // 'a'는 답하지 않고, 나머지는 답해서 "응답 없음"이 a 한 줄에서만 나오게 한다
    useSession.getState().answer('b', 0);
    useSession.getState().answer('c', 0);

    await render(<IqReviewScreen />);
    expect(screen.getByTestId('review-chosen-0').props.children).toBe('응답 없음');
  });

  // 세션이 깨져 chosenIndex가 선택지 범위를 벗어나도 크래시하지 않아야 한다.
  test('chosenIndex가 선택지 범위를 벗어나도 크래시하지 않고 "응답 없음"을 보여준다', async () => {
    useSession.getState().start('iq', 'default', 1, questions);
    useSession.getState().answer('a', 99);
    useSession.getState().answer('b', 0);
    useSession.getState().answer('c', 0);

    await render(<IqReviewScreen />);
    expect(screen.getByTestId('review-chosen-0').props.children).toBe('응답 없음');
  });

  test('세션이 비어 있으면 크래시하지 않는다', async () => {
    await render(<IqReviewScreen />);
    expect(screen.getByText('해설할 문항이 없습니다')).toBeTruthy();
  });
});
