import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import IqQuizScreen from '../../app/test/iq/quiz';
import { useSession } from '@/store/session';
import type { Question } from '@/engine/types';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn() }),
}));

function q(id: string): Question {
  return {
    id,
    kind: 'scored',
    prompt: `${id} 질문`,
    choices: [{ text: '보기1' }, { text: '보기2' }],
    answerIndex: 0,
    difficulty: 1,
  };
}

beforeEach(() => {
  mockReplace.mockClear();
  useSession.getState().reset();
  useSession.getState().start('iq', 'default', 1, [q('a')]);
});

// personalityQuiz.test.tsx / psychQuiz.test.tsx와 같은 이유 — QuizRunner의 진행
// 동작 자체는 다른 테스트가 이미 검증한다. 이 화면 껍데기가 실제로 지키는
// 유일한 약속은 resultRoute 문자열이 맞는가다.
describe('IqQuizScreen', () => {
  test('마지막 문항을 풀면 IQ 결과 화면으로 이동한다', async () => {
    await render(<IqQuizScreen />);
    await fireEvent.press(screen.getByTestId('choice-0'));
    expect(mockReplace).toHaveBeenCalledWith('/test/iq/result');
  });
});
