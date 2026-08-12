import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import QuizScreen from '../../app/test/dialect/quiz';
import { useSession } from '@/store/session';
import type { Question } from '@/engine/types';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
  useLocalSearchParams: () => ({ region: 'gyeongsang' }),
}));

function q(id: string): Question {
  return {
    id,
    kind: 'scored',
    prompt: `${id} 질문`,
    choices: [{ text: '보기1' }, { text: '보기2' }, { text: '보기3' }, { text: '보기4' }],
    answerIndex: 0,
    explanation: '해설',
    difficulty: 1,
  };
}

beforeEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
  useSession.getState().reset();
  useSession.getState().start('dialect', 'gyeongsang', 1, [q('a'), q('b')]);
});

describe('QuizScreen', () => {
  test('첫 문항의 질문과 선택지를 보여준다', async () => {
    await render(<QuizScreen />);
    expect(screen.getByText('a 질문')).toBeTruthy();
    expect(screen.getByText('보기1')).toBeTruthy();
    expect(screen.getByText('보기4')).toBeTruthy();
  });

  test('진행 상황을 보여준다', async () => {
    await render(<QuizScreen />);
    expect(screen.getByText('1 / 2')).toBeTruthy();
  });

  test('선택지를 고르면 다음 문항으로 넘어간다', async () => {
    await render(<QuizScreen />);
    await fireEvent.press(screen.getByTestId('choice-0'));
    expect(screen.getByText('b 질문')).toBeTruthy();
    expect(screen.getByText('2 / 2')).toBeTruthy();
  });

  test.each([0, 1, 2, 3])('%i번 보기를 누르면 같은 인덱스가 세션에 기록된다', async (choiceIndex) => {
    await render(<QuizScreen />);
    await fireEvent.press(screen.getByTestId(`choice-${choiceIndex}`));
    expect(useSession.getState().answers).toEqual([
      { questionId: 'a', chosenIndex: choiceIndex },
    ]);
  });

  test('마지막 문항을 풀면 결과 화면으로 이동한다', async () => {
    await render(<QuizScreen />);
    await fireEvent.press(screen.getByTestId('choice-0'));
    await fireEvent.press(screen.getByTestId('choice-1'));
    expect(mockReplace).toHaveBeenCalledWith('/test/dialect/result');
  });

  test('세션이 비어 있으면 크래시하지 않고 안내를 보여준다', async () => {
    useSession.getState().reset();
    await render(<QuizScreen />);
    expect(screen.getByText('응시 중인 시험이 없습니다')).toBeTruthy();
  });
});
