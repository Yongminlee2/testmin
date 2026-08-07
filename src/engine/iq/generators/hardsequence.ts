import { mulberry32, pickInt, shuffle } from '../../rng';
import { iqQuestionId } from '../questionId';
import type { GeneratedQuestion, Question } from '../../types';
import type { Generator } from './index';
import { MAX, pickDistractors } from './numeric';
import type { Built } from './numeric';

/**
 * 상위 난이도 수열. sequence(난이도 2)는 항끼리의 관계가 한 번에 보이지만
 * 여기 규칙들은 한 단계를 더 거쳐야 보인다 — 차이를 따로 적어봐야 하거나,
 * 한 항에 두 연산이 걸려 있거나, 연산이 번갈아 바뀐다.
 *
 * 상한(MAX)을 넘는 항이 나오면 파라미터를 다시 뽑는다. 선택지 버튼이
 * 화면을 넘치는 걸 막기 위해서다 — 정답뿐 아니라 화면에 찍히는 항 전부가 대상이다.
 */

/** terms와 answer가 모두 1..MAX 안에 있는가. 규칙마다 재시도 조건으로 쓴다. */
function inRange(values: readonly number[]): boolean {
  return values.every((n) => Number.isInteger(n) && n >= 1 && n <= MAX);
}

/**
 * 계차수열 — 항의 차이가 등차로 늘어난다. 예: 3, 5, 9, 15, 23 (차이 2,4,6,8)
 * 항만 봐서는 규칙이 안 보이고 차이를 따로 적어봐야 보인다.
 */
function buildSecondDiff(rand: () => number): Built {
  let start = 0;
  let d0 = 0;
  let e = 0;
  let terms: number[] = [];
  let answer = 0;
  do {
    start = pickInt(rand, 2, 12);
    d0 = pickInt(rand, 2, 7);
    e = pickInt(rand, 2, 6);
    terms = [start];
    for (let i = 1; i < 6; i++) {
      terms.push((terms[i - 1] as number) + d0 + (i - 1) * e);
    }
    answer = (terms[5] as number) + d0 + 5 * e;
  } while (!inRange([...terms, answer]));

  const last = terms[5] as number;
  const lastDiff = d0 + 5 * e;
  const prevDiff = d0 + 4 * e;

  return {
    terms,
    answer,
    // 차이가 그대로 유지된다고 본 값 / 차이를 한 번 더 늘린 값 / 한 칸 덜 감
    candidates: [last + prevDiff, last + lastDiff + e, last, answer + e],
    explanation:
      `항의 차이를 적어보면 ${d0}, ${d0 + e}, ${d0 + 2 * e} … 로 ${e}씩 늘어납니다. ` +
      `다음 차이는 ${lastDiff}이므로 ${last} + ${lastDiff} = ${answer}.`,
  };
}

/**
 * 한 항에 두 연산 — 앞의 수에 k를 곱하고 c를 더한다. 예: 2, 7, 22, 67 (×3 +1)
 * 곱셈만 보면 안 맞고 덧셈만 보면 안 맞아서, 두 연산을 같이 찾아야 한다.
 */
function buildLinear(rand: () => number): Built {
  let start = 0;
  let k = 0;
  let c = 0;
  let terms: number[] = [];
  let answer = 0;
  do {
    start = pickInt(rand, 1, 5);
    k = pickInt(rand, 2, 3);
    c = pickInt(rand, 1, 6);
    terms = [start];
    for (let i = 1; i < 5; i++) terms.push((terms[i - 1] as number) * k + c);
    answer = (terms[4] as number) * k + c;
  } while (!inRange([...terms, answer]));

  const last = terms[4] as number;

  return {
    terms,
    answer,
    // 더하기를 빼먹음 / 곱하기를 빼먹음 / 곱한 뒤 두 번 더함 / 한 칸 덜 감
    candidates: [last * k, last + c, last * k + 2 * c, last],
    explanation:
      `앞의 수에 ${k}를 곱하고 ${c}를 더합니다. ${last} × ${k} + ${c} = ${answer}.`,
  };
}

/**
 * 곱하는 수가 커진다 — ×2, ×3, ×4 … 예: 3, 6, 18, 72, 360
 * 배수라는 건 금방 보이지만 배수가 고정이 아니라는 걸 알아채야 풀린다.
 */
function buildRisingRatio(rand: () => number): Built {
  let start = 0;
  let r0 = 0;
  let terms: number[] = [];
  let answer = 0;
  do {
    start = pickInt(rand, 1, 4);
    r0 = pickInt(rand, 2, 3);
    terms = [start];
    for (let i = 1; i < 5; i++) terms.push((terms[i - 1] as number) * (r0 + i - 1));
    answer = (terms[4] as number) * (r0 + 3);
  } while (!inRange([...terms, answer]));

  const last = terms[4] as number;
  const lastRatio = r0 + 3;

  return {
    terms,
    answer,
    // 곱하는 수가 그대로라고 본 값 / 한 단계 더 큰 수를 곱함 / 한 칸 덜 감
    candidates: [last * (lastRatio - 1), last * (lastRatio + 1), last, answer + last],
    explanation:
      `곱하는 수가 ${r0}, ${r0 + 1}, ${r0 + 2} … 로 하나씩 커집니다. ` +
      `이번엔 ${lastRatio}를 곱해 ${last} × ${lastRatio} = ${answer}.`,
  };
}

/**
 * 두 연산이 번갈아 — ×k 다음엔 +c, 그다음 다시 ×k. 예: 4, 12, 17, 51, 56
 * 규칙이 항마다 바뀌므로 "다음 차례가 어느 연산인지"까지 세어야 한다.
 */
function buildAlternatingOps(rand: () => number): Built {
  let start = 0;
  let k = 0;
  let c = 0;
  let terms: number[] = [];
  let answer = 0;
  do {
    start = pickInt(rand, 2, 9);
    k = pickInt(rand, 2, 3);
    c = pickInt(rand, 3, 12);
    terms = [start];
    // 짝수 인덱스에서 짝을 이루도록 ×k → +c 순으로 번갈아 적용한다.
    for (let i = 1; i < 6; i++) {
      const prev = terms[i - 1] as number;
      terms.push(i % 2 === 1 ? prev * k : prev + c);
    }
    answer = (terms[5] as number) * k; // 6번째 항이 +c였으므로 다음은 ×k
  } while (!inRange([...terms, answer]));

  const last = terms[5] as number;

  return {
    terms,
    answer,
    // 연산 순서를 반대로 봄 / 곱하는 대신 더함 / 한 칸 덜 감
    candidates: [last + c, last * k + c, last, last * (k + 1)],
    explanation:
      `× ${k}와 + ${c}가 번갈아 나옵니다. 마지막에 ${c}를 더했으니 이번엔 곱할 차례라 ` +
      `${last} × ${k} = ${answer}.`,
  };
}

const BUILDERS: ReadonlyArray<(rand: () => number) => Built> = [
  buildSecondDiff,
  buildLinear,
  buildRisingRatio,
  buildAlternatingOps,
];

export const hardsequenceGenerator: Generator = {
  id: 'hardsequence',
  difficulty: 3,

  generate(seed: number): GeneratedQuestion {
    const rand = mulberry32(seed);
    const build = BUILDERS[pickInt(rand, 0, BUILDERS.length - 1)] as (
      rand: () => number
    ) => Built;
    const { terms, answer, candidates, explanation } = build(rand);

    const distractors = pickDistractors(answer, candidates, rand);
    const options = shuffle([answer, ...distractors], rand);
    const answerIndex = options.indexOf(answer);

    const question: Question = {
      id: iqQuestionId('hardsequence', seed),
      kind: 'scored',
      prompt: `다음 수열에서 ?에 들어갈 수는?\n\n${terms.join(', ')}, ?`,
      choices: options.map((n) => ({ text: String(n) })),
      answerIndex,
      explanation,
      difficulty: 3,
    };

    return { question, generatorId: 'hardsequence', seed };
  },
};
