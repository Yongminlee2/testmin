import {
  validateScoredQuestions,
  validateGradeTable,
  validateAnswerDistribution,
  validateAxisQuestions,
  validateVoteQuestions,
  validateAllPools,
} from '../../tools/validate-content';
import type { PoolScoring } from '../../src/content/registry';
import type { Question, GradeTable } from '@/engine/types';

function ok(id: string): Question {
  return {
    id,
    kind: 'scored',
    prompt: `${id} 문제`,
    choices: [{ text: 'ㄱ' }, { text: 'ㄴ' }, { text: 'ㄷ' }, { text: 'ㄹ' }],
    answerIndex: 0,
    explanation: '해설이 있습니다',
    difficulty: 1,
  };
}

/** validateAxisQuestions용 정상 문항. 표준 순서([2,1,-1,-2])와 표준 라벨을 쓴다. */
function axisOk(id: string, axis: string): Question {
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
    axis,
    explanation: `${id} 해설`,
    difficulty: 1,
  };
}

/** validateVoteQuestions용 정상 문항. 선택지마다 서로 다른 typeId로 표를 던진다. */
function voteOk(id: string, typeIds: readonly string[]): Question {
  return {
    id,
    kind: 'typed',
    prompt: `${id} 문항`,
    choices: typeIds.map((typeId, i) => ({ text: `보기${i}`, typeId })),
    explanation: `${id} 해설`,
    difficulty: 1,
  };
}

const opts = { expectedChoiceCount: 4 };

describe('validateScoredQuestions', () => {
  test('올바른 문항 묶음은 오류가 없다', () => {
    expect(validateScoredQuestions([ok('a'), ok('b')], opts)).toEqual([]);
  });

  test('answerIndex가 범위를 벗어나면 잡는다', () => {
    const bad = { ...ok('a'), answerIndex: 4 };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('answerIndex'))).toBe(true);
  });

  test('answerIndex가 없으면 잡는다', () => {
    const { answerIndex, ...rest } = ok('a');
    const errors = validateScoredQuestions([rest as Question], opts);
    expect(errors.some((e) => e.includes('answerIndex'))).toBe(true);
  });

  test('해설이 비어 있으면 잡는다', () => {
    const bad = { ...ok('a'), explanation: '   ' };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('해설'))).toBe(true);
  });

  test('ID 중복을 잡는다', () => {
    const errors = validateScoredQuestions([ok('a'), ok('a')], opts);
    expect(errors.some((e) => e.includes('중복'))).toBe(true);
  });

  test('선택지 개수가 규격과 다르면 잡는다', () => {
    const bad = { ...ok('a'), choices: [{ text: 'ㄱ' }, { text: 'ㄴ' }] };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('선택지 개수'))).toBe(true);
  });

  test('같은 문항 안의 선택지 텍스트 중복을 잡는다', () => {
    const bad = {
      ...ok('a'),
      choices: [{ text: 'ㄱ' }, { text: 'ㄱ' }, { text: 'ㄷ' }, { text: 'ㄹ' }],
    };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('선택지 텍스트'))).toBe(true);
  });

  test('빈 선택지 텍스트를 잡는다', () => {
    const bad = {
      ...ok('a'),
      choices: [{ text: '' }, { text: 'ㄴ' }, { text: 'ㄷ' }, { text: 'ㄹ' }],
    };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('비어'))).toBe(true);
  });

  test('오류 메시지에 문항 ID가 들어간다', () => {
    const bad = { ...ok('dialect-gs-0007'), explanation: '' };
    const errors = validateScoredQuestions([bad], opts);
    expect(errors.some((e) => e.includes('dialect-gs-0007'))).toBe(true);
  });
});

describe('validateAnswerDistribution', () => {
  function withAnswer(id: string, answerIndex: number): Question {
    return { ...ok(id), answerIndex };
  }

  test('전부 같은 인덱스면 잡는다', () => {
    const all: Question[] = Array.from({ length: 15 }, (_, i) => withAnswer(`q${i}`, 0));
    const errors = validateAnswerDistribution('pool', all);
    expect(errors.some((e) => e.includes('0번'))).toBe(true);
  });

  test('고르게 분포하면 통과한다', () => {
    const balanced: Question[] = Array.from({ length: 15 }, (_, i) => withAnswer(`q${i}`, i % 4));
    expect(validateAnswerDistribution('pool', balanced)).toEqual([]);
  });

  test('정확히 40%면 통과한다 (초과만 잡는다)', () => {
    // 10문항 중 4문항이 같은 인덱스 = 정확히 40%
    const exact: Question[] = [
      ...Array.from({ length: 4 }, (_, i) => withAnswer(`z${i}`, 0)),
      ...Array.from({ length: 6 }, (_, i) => withAnswer(`o${i}`, (i % 3) + 1)),
    ];
    expect(validateAnswerDistribution('pool', exact)).toEqual([]);
  });

  test('오류 메시지에 풀 ID가 들어간다', () => {
    const all: Question[] = Array.from({ length: 5 }, (_, i) => withAnswer(`q${i}`, 0));
    const errors = validateAnswerDistribution('dialect:gyeongsang', all);
    expect(errors.some((e) => e.includes('dialect:gyeongsang'))).toBe(true);
  });
});

describe('validateAxisQuestions', () => {
  test('올바른 문항 묶음(표준 순서, 표준 라벨)은 오류가 없다', () => {
    const errors = validateAxisQuestions(
      [axisOk('a', 'EI'), axisOk('b', 'EI'), axisOk('c', 'SN')],
      opts
    );
    expect(errors).toEqual([]);
  });

  test('반대 방향 표준 순서([-2,-1,1,2])도 통과한다', () => {
    const reversed: Question = {
      ...axisOk('a', 'EI'),
      choices: [
        { text: '매우 그렇다', weight: -2 },
        { text: '그렇다', weight: -1 },
        { text: '아니다', weight: 1 },
        { text: '전혀 아니다', weight: 2 },
      ],
    };
    expect(validateAxisQuestions([reversed], opts)).toEqual([]);
  });

  test('weight 순서가 뒤섞이면 잡는다 (척도가 조용히 뒤집히는 경우)', () => {
    const scrambled: Question = {
      ...axisOk('a', 'EI'),
      choices: [
        { text: '매우 그렇다', weight: 1 },
        { text: '그렇다', weight: 2 },
        { text: '아니다', weight: -1 },
        { text: '전혀 아니다', weight: -2 },
      ],
    };
    const errors = validateAxisQuestions([scrambled], opts);
    expect(errors.some((e) => e.includes('weight'))).toBe(true);
  });

  test('선택지 라벨이 문항마다 다르면 잡는다', () => {
    const mismatched: Question = {
      ...axisOk('b', 'SN'),
      choices: [
        { text: '아주 그렇다', weight: 2 },
        { text: '그렇다', weight: 1 },
        { text: '아니다', weight: -1 },
        { text: '전혀 아니다', weight: -2 },
      ],
    };
    const errors = validateAxisQuestions([axisOk('a', 'EI'), mismatched], opts);
    expect(errors.some((e) => e.includes('라벨'))).toBe(true);
  });

  test('axis 합계형 문항에 answerIndex가 있으면 잡는다', () => {
    const bad = { ...axisOk('a', 'EI'), answerIndex: 0 };
    const errors = validateAxisQuestions([bad], opts);
    expect(errors.some((e) => e.includes('answerIndex'))).toBe(true);
  });

  test('axis가 없거나 유효하지 않으면 잡는다', () => {
    const bad = { ...axisOk('a', 'EI'), axis: 'XX' };
    const errors = validateAxisQuestions([bad], opts);
    expect(errors.some((e) => e.includes('axis'))).toBe(true);
  });
});

describe('validateVoteQuestions', () => {
  test('올바른 문항 묶음은 오류가 없다', () => {
    const errors = validateVoteQuestions(
      [voteOk('a', ['t1', 't2', 't3', 't4']), voteOk('b', ['t1', 't2', 't3', 't4'])],
      opts
    );
    expect(errors).toEqual([]);
  });

  test('선택지에 weight가 있으면 잡는다 (득표형은 weight를 쓰지 않는다)', () => {
    const bad: Question = {
      ...voteOk('a', ['t1', 't2', 't3', 't4']),
      choices: [
        { text: '보기0', typeId: 't1', weight: 1 },
        { text: '보기1', typeId: 't2' },
        { text: '보기2', typeId: 't3' },
        { text: '보기3', typeId: 't4' },
      ],
    };
    const errors = validateVoteQuestions([bad], opts);
    expect(errors.some((e) => e.includes('weight'))).toBe(true);
  });

  test('득표형 문항에 answerIndex가 있으면 잡는다', () => {
    const bad = { ...voteOk('a', ['t1', 't2', 't3', 't4']), answerIndex: 0 };
    const errors = validateVoteQuestions([bad], opts);
    expect(errors.some((e) => e.includes('answerIndex'))).toBe(true);
  });

  test('typeId가 없는 선택지를 잡는다', () => {
    const bad: Question = {
      ...voteOk('a', ['t1', 't2', 't3', 't4']),
      choices: [
        { text: '보기0' },
        { text: '보기1', typeId: 't2' },
        { text: '보기2', typeId: 't3' },
        { text: '보기3', typeId: 't4' },
      ],
    };
    const errors = validateVoteQuestions([bad], opts);
    expect(errors.some((e) => e.includes('typeId'))).toBe(true);
  });

  test('한 문항 안에서 typeId가 중복되면 잡는다', () => {
    const errors = validateVoteQuestions([voteOk('a', ['t1', 't1', 't3', 't4'])], opts);
    expect(errors.some((e) => e.includes('중복'))).toBe(true);
  });
});

describe('validateAllPools', () => {
  test('POOL_SCORING에 등록되지 않은 풀은 조용히 건너뛰지 않고 오류를 낸다', () => {
    const pools: Record<string, readonly Question[]> = { 'mystery:default': [axisOk('a', 'EI')] };
    const scoring: Record<string, PoolScoring> = {};

    const { errors, totalQuestions } = validateAllPools(pools, scoring);
    expect(errors.some((e) => e.includes('mystery:default'))).toBe(true);
    // 등록 누락이어도 문항 수는 계속 집계한다 — 개수 리포트가 조용히 축소되지 않게.
    expect(totalQuestions).toBe(1);
  });

  test('scored/axis/vote 각 채점 방식으로 올바르게 갈라 검사한다', () => {
    // dialect는 answerIndex 분포가 40%를 넘으면 잡히므로, 세 문항의 정답 위치를 고르게 둔다.
    const pools: Record<string, readonly Question[]> = {
      'dialect:x': [
        { ...ok('d1'), answerIndex: 0 },
        { ...ok('d2'), answerIndex: 1 },
        { ...ok('d3'), answerIndex: 2 },
      ],
      'personality:x': [axisOk('p1', 'EI')],
      'psych:x': [voteOk('v1', ['t1', 't2', 't3', 't4'])],
    };
    const scoring: Record<string, PoolScoring> = {
      'dialect:x': 'scored',
      'personality:x': 'axis',
      'psych:x': 'vote',
    };

    const { errors, totalQuestions } = validateAllPools(pools, scoring);
    expect(errors).toEqual([]);
    expect(totalQuestions).toBe(5);
  });
});

describe('validateGradeTable', () => {
  const good: GradeTable = {
    bands: [
      { min: 100, grade: 1, title: '1급' },
      { min: 50, grade: 5, title: '5급' },
      { min: 0, grade: 9, title: '9급' },
    ],
  };

  test('올바른 테이블은 오류가 없다', () => {
    expect(validateGradeTable('t', good)).toEqual([]);
  });

  test('내림차순이 아니면 잡는다', () => {
    const bad: GradeTable = {
      bands: [
        { min: 50, grade: 5, title: '5급' },
        { min: 100, grade: 1, title: '1급' },
        { min: 0, grade: 9, title: '9급' },
      ],
    };
    expect(validateGradeTable('t', bad).some((e) => e.includes('내림차순'))).toBe(true);
  });

  test('최상 밴드가 100이 아니면 잡는다', () => {
    const bad: GradeTable = {
      bands: [
        { min: 90, grade: 1, title: '1급' },
        { min: 0, grade: 9, title: '9급' },
      ],
    };
    expect(validateGradeTable('t', bad).some((e) => e.includes('100'))).toBe(true);
  });

  test('최하 밴드가 0이 아니면 잡는다', () => {
    const bad: GradeTable = {
      bands: [
        { min: 100, grade: 1, title: '1급' },
        { min: 10, grade: 9, title: '9급' },
      ],
    };
    expect(validateGradeTable('t', bad).some((e) => e.includes('0%'))).toBe(true);
  });

  test('칭호가 비면 잡는다', () => {
    const bad: GradeTable = {
      bands: [
        { min: 100, grade: 1, title: '' },
        { min: 0, grade: 9, title: '9급' },
      ],
    };
    expect(validateGradeTable('t', bad).some((e) => e.includes('칭호'))).toBe(true);
  });
});
