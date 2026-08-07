import {
  validateScoredQuestions,
  validateGradeTable,
  validateAnswerDistribution,
  validateAxisQuestions,
  validateVoteQuestions,
  validateAllPools,
  validateGenerators,
  validateGeneratorCapacity,
  measureGeneratorCapacity,
  validateIqQuestions,
  validateIqAssembly,
} from '../../tools/validate-content';
import type { PoolScoring } from '../../src/content/registry';
import type { Question, GradeTable, GeneratedQuestion } from '@/engine/types';
import type { Generator } from '@/engine/iq/generators';
import { GENERATORS } from '@/engine/iq/generators';
import type { IqDrawConfig } from '@/engine/iq/assembleIq';
import { IQ_DRAW } from '@/content/registry';

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

/**
 * IQ는 POOLS에 없어서 validateAllPools 순회로는 절대 검사되지 않는다.
 * 이 검사가 없으면 릴리스 게이트가 앱의 가장 큰 문항 공급원을 그냥 통과시킨다.
 */
describe('validateGenerators', () => {
  function goodQuestion(seed: number): GeneratedQuestion {
    return {
      question: {
        id: `good-${seed}`,
        kind: 'scored',
        prompt: `${seed}번 문제`,
        choices: [{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd' }, { text: 'e' }],
        answerIndex: seed % 5,
        explanation: '해설',
        difficulty: 1,
      },
      generatorId: 'good',
      seed,
    };
  }

  test('정상 생성기는 지정한 시드 수만큼 검증하고 오류가 없다', () => {
    const good: Generator = { id: 'good', difficulty: 1, generate: goodQuestion };
    const { errors, totalGenerated } = validateGenerators([good], 5);
    expect(errors).toEqual([]);
    expect(totalGenerated).toBe(5);
  });

  test('생성기가 잘못된 문항을 내면 오류 메시지에 생성기 id와 시드가 들어간다', () => {
    const bad: Generator = {
      id: 'bad',
      difficulty: 1,
      generate: (seed) => ({
        ...goodQuestion(seed),
        generatorId: 'bad',
        question: { ...goodQuestion(seed).question, choices: [{ text: 'a' }, { text: 'b' }] },
      }),
    };
    const { errors } = validateGenerators([bad], 3);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.every((e) => e.includes('bad'))).toBe(true);
    // verifyGenerated가 이미 [id/seed] 형식으로 시드를 찍는다
    expect(errors[0]).toMatch(/bad\/1/);
  });

  test('실제 등록된 생성기 6종은 시드 1~200에서 오류가 없다', () => {
    const { errors, totalGenerated } = validateGenerators(GENERATORS, 200);
    expect(errors).toEqual([]);
    expect(totalGenerated).toBe(GENERATORS.length * 200);
  });
});

/**
 * validateGenerators(생성기 각각이 유효한 문항을 내는가)는 통과하는데도
 * IQ_DRAW가 요구하는 슬롯 수가 어떤 생성기의 실측 퍼즐 용량 이상이면
 * assembleIq가 실제 출제에서만 예외를 던진다. 그 사각지대를 잡는 검사라
 * validateGenerators와는 별도로 테스트한다.
 */
describe('measureGeneratorCapacity / validateGeneratorCapacity', () => {
  /** values의 서로 다른 개수만큼만 퍼즐을 낼 수 있는 가짜 생성기. figure가 없어
   * puzzleKey가 prompt로 구분하므로, prompt에 값을 그대로 박아 용량을 통제한다. */
  function makeGen(id: string, values: readonly number[]): Generator {
    return {
      id,
      difficulty: 1,
      generate: (seed) => ({
        question: {
          id: `${id}-${seed}`,
          kind: 'scored',
          prompt: `문항 ${values[seed % values.length]}`,
          choices: [{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd' }, { text: 'e' }],
          answerIndex: 0,
          explanation: '해설',
          difficulty: 1,
        },
        generatorId: id,
        seed,
      }),
    };
  }

  test('measureGeneratorCapacity는 서로 다른 퍼즐 개수를 센다', () => {
    const gen = makeGen('wide', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(measureGeneratorCapacity(gen, 50)).toBe(10);
  });

  test('용량이 수요보다 크면 통과한다', () => {
    const gen = makeGen('wide', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); // 용량 10
    const config: IqDrawConfig = { questionCount: 3, difficultyMix: { 1: 3 } }; // 수요 3
    expect(validateGeneratorCapacity([gen], config, 50)).toEqual([]);
  });

  // 등호도 실패시켜야 한다 — "용량 == 수요"가 바로 count 생성기(넓히기 전)가
  // 실제로 걸렸던 상태다. 여유(capacity > demand)가 없으면 언젠가 막힌다.
  test('용량이 수요와 정확히 같으면 잡는다 (등호도 실패)', () => {
    const gen = makeGen('narrow', [1, 2, 3]); // 용량 3
    const config: IqDrawConfig = { questionCount: 3, difficultyMix: { 1: 3 } }; // 수요 3
    const errors = validateGeneratorCapacity([gen], config, 50);
    expect(errors.some((e) => e.includes('narrow'))).toBe(true);
    expect(errors.some((e) => e.includes('3') && e.includes('3'))).toBe(true);
  });

  test('용량이 수요보다 작으면 잡는다', () => {
    const gen = makeGen('tiny', [1, 2]); // 용량 2
    const config: IqDrawConfig = { questionCount: 3, difficultyMix: { 1: 3 } }; // 수요 3
    const errors = validateGeneratorCapacity([gen], config, 50);
    expect(errors.some((e) => e.includes('tiny'))).toBe(true);
  });

  test('그 난이도에서 실제로 쓰이지 않는 생성기(수요 0)는 검사하지 않는다', () => {
    const unused = makeGen('unused', [1]); // 용량 1
    const used = makeGen('used', [1, 2, 3, 4]);
    // 둘 다 난이도를 1로 두면 라운드로빈상 unused도 슬롯을 받아버리므로,
    // "수요 0"인 생성기를 확실히 만들기 위해 unused만 다른 난이도로 옮긴다.
    const unusedAtDifficulty2: Generator = { ...unused, difficulty: 2 };
    const config: IqDrawConfig = { questionCount: 2, difficultyMix: { 1: 2 } }; // 난이도2는 수요 0
    const errors = validateGeneratorCapacity([used, unusedAtDifficulty2], config, 50);
    expect(errors).toEqual([]);
  });

  test('실제 등록된 생성기 6종과 IQ_DRAW 조합은 용량이 수요보다 넉넉하다', () => {
    expect(validateGeneratorCapacity(GENERATORS, IQ_DRAW, 1000)).toEqual([]);
  });

  // 리뷰 항목4 증거 — count를 넓히기 전엔 용량 3 == 수요 3으로 이 테스트가
  // 실패했어야 한다. Task 1에서 배치표를 12칸으로 늘리고 보폭 1·2를 섞어
  // 용량이 13(증가·보폭1 3 + 증가·보폭2 2 + 감소·보폭1 6 + 감소·보폭2 2)이
  // 되었다.
  test('count 생성기의 실측 용량은 13이다 (증가 5종 + 감소 8종)', () => {
    const count = GENERATORS.find((g) => g.id === 'count');
    expect(count).toBeDefined();
    expect(measureGeneratorCapacity(count as Generator, 1000)).toBe(13);
  });
});

/**
 * 리뷰 I-6 — 게이트가 IQ에 대해 실제로 도는 것은 validateGenerators(생성기
 * 하나를 시드 하나로 돌린 결과)와 validateGeneratorCapacity(용량 대 수요)뿐
 * 이었다. 실제 출제 함수 assembleIq의 **출력**(정답 위치 분포·격자 구조·문항
 * id 계약)은 아무도 안 봤다 — IQ는 POOLS에 없어서 validateAllPools 순회도
 * 이 앱의 최대 문항 공급원을 영원히 건너뛴다. validateIqQuestions가 그
 * 세 가지를 assembleIq 출력(GeneratedQuestion[])에 대해 본다.
 */
describe('validateIqQuestions', () => {
  function gridQuestion(
    id: string,
    generatorId: string,
    seed: number,
    overrides: Partial<Question> = {}
  ): GeneratedQuestion {
    return {
      question: {
        id,
        kind: 'scored',
        prompt: '빈 칸에 들어갈 도형은?',
        figure: {
          kind: 'grid',
          cells: Array.from({ length: 9 }, () => ({ shapes: [] })),
          blankIndex: 8,
        },
        choices: [{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd' }, { text: 'e' }],
        answerIndex: 0,
        explanation: '해설',
        difficulty: 1,
        ...overrides,
      },
      generatorId,
      seed,
    };
  }

  test('정답 위치가 고르게 퍼진 정상 격자 문항 묶음은 오류가 없다', () => {
    const set: GeneratedQuestion[] = Array.from({ length: 20 }, (_, i) =>
      gridQuestion(`iq-fake-${i}`, 'fake', i, { answerIndex: i % 5 })
    );
    expect(validateIqQuestions(set)).toEqual([]);
  });

  // M1 대응 — sequence의 shuffle을 지워 answerIndex가 항상 0이 되게 만든 것과
  // 같은 모양. validateAnswerDistribution을 그대로 재사용해 잡는다.
  test('정답 위치가 한쪽으로 쏠리면 잡는다', () => {
    const set: GeneratedQuestion[] = Array.from({ length: 20 }, (_, i) =>
      gridQuestion(`iq-fake-${i}`, 'fake', i, { answerIndex: 0 })
    );
    const errors = validateIqQuestions(set);
    expect(errors.some((e) => e.includes('0번'))).toBe(true);
  });

  // M3 대응 — size.ts에서 blankIndex를 통째로 지운 것과 같은 모양.
  // blankIndex가 없으면 격자 9칸이 전부 그려져 정답이 그대로 인쇄된다.
  test('격자 문항에 blankIndex가 없으면 잡는다', () => {
    const bad = gridQuestion('iq-fake-1', 'fake', 1);
    const withoutBlankIndex: GeneratedQuestion = {
      ...bad,
      question: {
        ...bad.question,
        figure: { kind: 'grid', cells: bad.question.figure!.cells },
      },
    };
    const errors = validateIqQuestions([withoutBlankIndex]);
    expect(errors.some((e) => e.includes('blankIndex'))).toBe(true);
  });

  test('격자 칸 수가 9개가 아니면 잡는다', () => {
    const bad = gridQuestion('iq-fake-1', 'fake', 1);
    const wrongCellCount: GeneratedQuestion = {
      ...bad,
      question: {
        ...bad.question,
        figure: {
          kind: 'grid',
          cells: bad.question.figure!.cells.slice(0, 8),
          blankIndex: 7,
        },
      },
    };
    const errors = validateIqQuestions([wrongCellCount]);
    expect(errors.some((e) => e.includes('9칸'))).toBe(true);
  });

  // M12 대응 — sequence의 id를 'seq2'로 바꾸면(숫자가 정규식을 깬다)
  // parseIqQuestionId가 undefined를 준다. jest(questionId.test.ts)는 이미
  // 잡지만 게이트는 못 잡았다.
  test('문항 id가 iq-<generatorId>-<seed> 형식이 아니면 잡는다', () => {
    const bad = gridQuestion('seq2-5', 'sequence', 5);
    const errors = validateIqQuestions([bad]);
    expect(errors.some((e) => e.includes('형식'))).toBe(true);
  });

  test('문항 id를 파싱한 값이 실제 생성기·시드와 다르면 잡는다', () => {
    // id는 iq-other-99라고 말하는데 실제로 만든 건 fake/1이다.
    const bad = gridQuestion('iq-other-99', 'fake', 1);
    const errors = validateIqQuestions([bad]);
    expect(errors.some((e) => e.includes('다릅니다'))).toBe(true);
  });

  // sequence처럼 figure가 없는 생성기는 격자 검사 대상이 아니다.
  // (정답 위치를 5개에 고르게 둬서 answerDistribution 검사에 안 걸리게 한다 —
  // 이 테스트가 보려는 것은 격자 검사 건너뛰기이지 분포 검사가 아니다.)
  test('figure가 없는 문항은 격자 검사를 건너뛴다', () => {
    const noFigure = (i: number): GeneratedQuestion => ({
      question: {
        id: `iq-sequence-${i}`,
        kind: 'scored',
        prompt: '다음 수열에서 ?에 들어갈 수는?',
        choices: [{ text: '1' }, { text: '2' }, { text: '3' }, { text: '4' }, { text: '5' }],
        answerIndex: i % 5,
        explanation: '해설',
        difficulty: 2,
      },
      generatorId: 'sequence',
      seed: i,
    });
    const set = Array.from({ length: 5 }, (_, i) => noFigure(i));
    expect(validateIqQuestions(set)).toEqual([]);
  });
});

describe('validateIqAssembly', () => {
  // POOLS에는 IQ를 추가하지 않고, assembleIq를 시드 여러 개로 직접 돌려
  // validateIqQuestions를 적용한다는 실제 배선이 실제 등록된 생성기·설정으로도
  // 통과하는지 확인한다.
  test('실제 IQ_DRAW·GENERATORS 조합은 시드 30개에서 오류가 없다', () => {
    expect(validateIqAssembly(IQ_DRAW, 30)).toEqual([]);
  });
});
