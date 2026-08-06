import { scoreTest } from '@/engine/score';
import type { Question, GradeBand } from '@/engine/types';

const bands: readonly GradeBand[] = [
  { min: 100, grade: 1, title: '1급' },
  { min: 50, grade: 5, title: '5급' },
  { min: 0, grade: 9, title: '9급' },
];

function q(id: string, answerIndex: number): Question {
  return {
    id,
    kind: 'scored',
    prompt: `문제 ${id}`,
    choices: [{ text: 'ㄱ' }, { text: 'ㄴ' }, { text: 'ㄷ' }, { text: 'ㄹ' }],
    answerIndex,
    explanation: `${id} 해설`,
    difficulty: 1,
  };
}

const questions: readonly Question[] = [q('a', 0), q('b', 1), q('c', 2), q('d', 3)];

describe('scoreTest', () => {
  test('전부 맞히면 만점과 최상 급수', () => {
    const result = scoreTest(questions, [
      { questionId: 'a', chosenIndex: 0 },
      { questionId: 'b', chosenIndex: 1 },
      { questionId: 'c', chosenIndex: 2 },
      { questionId: 'd', chosenIndex: 3 },
    ], bands);

    expect(result.correct).toBe(4);
    expect(result.total).toBe(4);
    expect(result.percent).toBe(100);
    expect(result.grade).toBe(1);
    expect(result.wrong).toHaveLength(0);
  });

  test('전부 틀리면 0점과 최하 급수', () => {
    const result = scoreTest(questions, [
      { questionId: 'a', chosenIndex: 1 },
      { questionId: 'b', chosenIndex: 0 },
      { questionId: 'c', chosenIndex: 0 },
      { questionId: 'd', chosenIndex: 0 },
    ], bands);

    expect(result.correct).toBe(0);
    expect(result.grade).toBe(9);
    expect(result.wrong).toHaveLength(4);
  });

  test('틀린 문항에 내가 고른 답과 정답이 함께 담긴다', () => {
    const result = scoreTest(questions, [
      { questionId: 'a', chosenIndex: 0 },
      { questionId: 'b', chosenIndex: 3 },
      { questionId: 'c', chosenIndex: 2 },
      { questionId: 'd', chosenIndex: 3 },
    ], bands);

    expect(result.wrong).toEqual([
      { questionId: 'b', chosenIndex: 3, answerIndex: 1 },
    ]);
  });

  test('응답이 없는 문항은 오답 처리하고 chosenIndex는 -1', () => {
    const result = scoreTest(questions, [
      { questionId: 'a', chosenIndex: 0 },
    ], bands);

    expect(result.correct).toBe(1);
    expect(result.wrong).toHaveLength(3);
    expect(result.wrong.every((w) => w.chosenIndex === -1)).toBe(true);
  });

  test('문항 순서대로 오답이 쌓인다', () => {
    const result = scoreTest(questions, [], bands);
    expect(result.wrong.map((w) => w.questionId)).toEqual(['a', 'b', 'c', 'd']);
  });

  test('answerIndex가 없는 문항은 채점 대상에서 제외한다', () => {
    const broken: Question = {
      id: 'x',
      kind: 'typed',
      prompt: '유형형 문항',
      choices: [{ text: 'ㄱ' }, { text: 'ㄴ' }],
      axis: 'EI',
      difficulty: 1,
    };
    const result = scoreTest([...questions, broken], [
      { questionId: 'a', chosenIndex: 0 },
      { questionId: 'b', chosenIndex: 1 },
      { questionId: 'c', chosenIndex: 2 },
      { questionId: 'd', chosenIndex: 3 },
      { questionId: 'x', chosenIndex: 0 },
    ], bands);

    expect(result.total).toBe(4);
    expect(result.correct).toBe(4);
  });

  test('문항이 하나도 없으면 0점 9급이고 예외를 던지지 않는다', () => {
    const result = scoreTest([], [], bands);
    expect(result.total).toBe(0);
    expect(result.correct).toBe(0);
    expect(result.percent).toBe(0);
    expect(result.grade).toBe(9);
  });
});
