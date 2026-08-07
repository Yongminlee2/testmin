import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react-native';
import { QuizRunner } from '@/ui/QuizRunner';
import { useSession } from '@/store/session';
import type { Question } from '@/engine/types';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

/**
 * 리뷰 I-4 — 셔플/비셔플 분리는 assemble.ts(:72)와 assembleTyped.ts(:48)에서만
 * 구조적으로 보장된다. 이 계획이 확장한 QuizRunner(렌더 층)에는 아무 보장도
 * 없었다 — M9: 렌더 직전에 `shuffle(current.choices, mulberry32(index+7))`를
 * 끼워 넣어도 339개 전부 통과했다. 리커트 척도(성격)는 순서 자체가 뜻을
 * 갖고, `choose(i)`는 렌더 위치를 그대로 채점에 넘기므로(성격은 척도가
 * 뒤집히고, 심리는 typeId 매핑이 어긋나고, 사투리·IQ는 채점이 통째로 틀어진다)
 * 이 한 줄이 네 시험을 동시에 깬다. 그런데 기존 quiz.test.tsx의
 * "고른 답이 세션에 기록된다"는 choice-2를 눌러 chosenIndex: 2를 기대할 뿐
 * 화면에 실제로 무엇이 찍혔는지는 안 보므로 셔플되어도 그대로 통과한다.
 *
 * 그래서 화면당이 아니라 QuizRunner 컴포넌트에 "세션에 담긴 선택지 순서를
 * 그대로 렌더한다"를 못박는다 — 네 시험이 공유하는 컴포넌트라 여기 하나로
 * 전부 보호된다. 리커트 라벨 4개를 순서까지(각 choice-N 안에 그 라벨이
 * 있는지) 단언한다.
 */
function likertQuestion(id: string): Question {
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
    axis: 'EI',
    explanation: '해설',
    difficulty: 1,
  };
}

const EXPECTED_ORDER = ['매우 그렇다', '그렇다', '아니다', '전혀 아니다'];

function expectChoicesInOrder(): void {
  EXPECTED_ORDER.forEach((label, i) => {
    expect(within(screen.getByTestId(`choice-${i}`)).getByText(label)).toBeTruthy();
  });
}

beforeEach(() => {
  useSession.getState().reset();
});

describe('QuizRunner 선택지 순서 보존', () => {
  test('세션에 담긴 선택지 순서를 그대로 렌더한다 — 리커트 순서가 화면에서도 유지된다', async () => {
    useSession.getState().start('personality', 'default', 1, [likertQuestion('a')]);
    await render(<QuizRunner resultRoute="/test/personality/result" />);

    expectChoicesInOrder();
  });

  test('문항이 넘어가도 매 문항에서 선택지 순서를 그대로 렌더한다', async () => {
    useSession
      .getState()
      .start('personality', 'default', 1, [
        likertQuestion('a'),
        likertQuestion('b'),
        likertQuestion('c'),
      ]);
    await render(<QuizRunner resultRoute="/test/personality/result" />);

    expectChoicesInOrder();
    await fireEvent.press(screen.getByTestId('choice-0'));
    expectChoicesInOrder();
    await fireEvent.press(screen.getByTestId('choice-0'));
    expectChoicesInOrder();
  });
});
