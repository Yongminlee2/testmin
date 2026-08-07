import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { QuizRunner } from '@/ui/QuizRunner';
import { useSession } from '@/store/session';
import { shape } from '@/engine/iq/figure';
import type { FigureSpec, Question } from '@/engine/types';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

function single(): FigureSpec {
  return { kind: 'single', cells: [{ shapes: [shape('circle')] }] };
}

function textQuestion(id: string): Question {
  return {
    id,
    kind: 'scored',
    prompt: `${id} 질문`,
    choices: [{ text: '보기1' }, { text: '보기2' }],
    answerIndex: 0,
    difficulty: 1,
  };
}

function figureQuestion(id: string): Question {
  return {
    id,
    kind: 'scored',
    prompt: `${id} 질문`,
    figure: single(),
    choices: [{ figure: single() }, { figure: single() }],
    answerIndex: 0,
    difficulty: 1,
  };
}

beforeEach(() => {
  useSession.getState().reset();
});

describe('QuizRunner 도형 지원', () => {
  test('figure가 있는 선택지는 도형을 그린다', async () => {
    useSession.getState().start('iq', 'default', 1, [figureQuestion('a')]);
    await render(<QuizRunner resultRoute="/test/iq/result" />);
    expect(screen.getByTestId('choice-figure-0')).toBeTruthy();
    expect(screen.getByTestId('choice-figure-1')).toBeTruthy();
  });

  test('figure가 없는 선택지는 지금처럼 텍스트를 그린다', async () => {
    useSession.getState().start('dialect', 'gyeongsang', 1, [textQuestion('a')]);
    await render(<QuizRunner resultRoute="/test/dialect/result" />);
    expect(screen.getByText('보기1')).toBeTruthy();
    expect(screen.getByText('보기2')).toBeTruthy();
    expect(screen.queryByTestId('choice-figure-0')).toBeNull();
  });

  test('도형 선택지에도 접근성 이름이 붙는다', async () => {
    useSession.getState().start('iq', 'default', 1, [figureQuestion('a')]);
    await render(<QuizRunner resultRoute="/test/iq/result" />);
    // 이름 없는 버튼이 나가는 걸 막는다 — TalkBack이 읽을 거리가 있는지 확인
    expect(screen.getByLabelText('1번 보기')).toBeTruthy();
    expect(screen.getByLabelText('2번 보기')).toBeTruthy();
  });

  test('문제에 figure가 있으면 문제 도형을 그린다', async () => {
    useSession.getState().start('iq', 'default', 1, [figureQuestion('a')]);
    await render(<QuizRunner resultRoute="/test/iq/result" />);
    expect(screen.getByTestId('question-figure')).toBeTruthy();
  });

  test('문제에 figure가 없으면 문제 도형을 그리지 않는다(회귀 방지)', async () => {
    useSession.getState().start('dialect', 'gyeongsang', 1, [textQuestion('a')]);
    await render(<QuizRunner resultRoute="/test/dialect/result" />);
    expect(screen.queryByTestId('question-figure')).toBeNull();
  });
});
