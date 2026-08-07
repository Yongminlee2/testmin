import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import PersonalityQuizScreen from '../../app/test/personality/quiz';
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
    kind: 'typed',
    prompt: `${id} 문항`,
    choices: [{ text: '매우 그렇다', weight: 2 }, { text: '전혀 아니다', weight: -2 }],
    axis: 'EI',
    difficulty: 1,
  };
}

beforeEach(() => {
  mockReplace.mockClear();
  useSession.getState().reset();
  useSession.getState().start('personality', 'default', 1, [q('a')]);
});

// QuizRunner 자체의 진행 동작은 dialect의 quiz.test.tsx와 QuizRunner.figure.test.tsx가
// 이미 검증한다. 이 화면 껍데기가 실제로 지키는 유일한 약속은 resultRoute 문자열이
// 맞는가다 — 오타(예: '/test/personality/results')가 나면 마지막 문항을 풀고도
// 죽은 경로로 가서 사용자가 붕 뜬다. 그걸 잡는 최소한의 테스트.
describe('PersonalityQuizScreen', () => {
  test('마지막 문항을 풀면 성격 결과 화면으로 이동한다', async () => {
    await render(<PersonalityQuizScreen />);
    await fireEvent.press(screen.getByTestId('choice-0'));
    expect(mockReplace).toHaveBeenCalledWith('/test/personality/result');
  });
});
