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

  // 리뷰 화면(app/test/dialect/review.tsx)은 정답·오답 문항을 전부 보여준다.
  // 버튼과 안내 문구가 "틀린 문항만" 볼 수 있는 것처럼 말하면 실제 동작과 어긋난다.
  // 느슨한 substring(예: '틀린'만 확인)은 회귀를 못 잡으므로 렌더된 문자열 전체로 검증한다.
  test('해설 보기 버튼과 안내 문구는 리뷰가 오답만 걸러 보여준다고 말하지 않는다', async () => {
    useSession.getState().start('dialect', 'gyeongsang', 1, questions);
    useSession.getState().answer('a', 1); // 오답 (정답은 0)
    useSession.getState().answer('b', 1); // 정답
    useSession.getState().answer('c', 2); // 정답
    useSession.getState().answer('d', 3); // 정답

    await render(<ResultScreen />);

    expect(screen.getByText('✎ 문항별 해설 보기')).toBeTruthy();
    expect(
      screen.getByText('틀린 문항은 1개예요. 전체 문항 해설을 확인해보세요.'),
    ).toBeTruthy();
    // 예전 문구("틀린 N문항 해설 보기")가 되살아나면 이 매치가 걸린다.
    expect(screen.queryByText(/틀린 \d+문항 해설 보기/)).toBeNull();
  });
});
