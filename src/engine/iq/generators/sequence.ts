import { mulberry32, pickInt, shuffle } from '../../rng';
import type { GeneratedQuestion, Question } from '../../types';
import type { Generator } from './index';

/** 선택지 버튼이 화면을 넘치지 않는 상한. 항·선택지 모두 이 안에 들어와야 한다. */
const MAX = 9999;

/**
 * 규칙에서 나온 "그럴듯한 오답" 후보를 받아 정답과 다른 4개를 고른다.
 * 후보가 모자라면 정답 ±k로 채운다 — 교육적이진 않지만 5지선다는 채워야 한다.
 * 상한(9999)을 넘는 값은 버린다. 선택지 버튼이 화면을 넘치기 때문이다.
 */
function pickDistractors(
  answer: number,
  candidates: readonly number[],
  rand: () => number
): number[] {
  const ok = (n: number): boolean => Number.isInteger(n) && n >= 1 && n <= MAX;

  const out: number[] = [];
  const seen = new Set<number>([answer]);
  for (const c of candidates) {
    if (out.length === 4) break;
    if (!ok(c) || seen.has(c)) continue;
    seen.add(c);
    out.push(c);
  }
  // 부족분은 정답 근처 값으로 채운다. 1부터 차례로 늘려가며 위아래를 번갈아 본다.
  for (let k = 1; out.length < 4; k++) {
    for (const cand of [answer + k, answer - k]) {
      if (out.length === 4) break;
      if (!ok(cand) || seen.has(cand)) continue;
      seen.add(cand);
      out.push(cand);
    }
    if (k > MAX) throw new Error(`오답을 채울 수 없습니다: answer=${answer}`);
  }
  return shuffle(out, rand);
}

interface Built {
  readonly terms: readonly number[];
  readonly answer: number;
  readonly candidates: readonly number[];
  readonly explanation: string;
}

/**
 * 등차수열. 증가/감소 두 방향 다 나와야 "항상 커진다"를 외우는 걸 막는다.
 * step 하한이 둘 다 2인 이유: step === 1이면 오답 후보 "answer - 1"이
 * 정답 바로 앞 항(last)과 같아져 pickDistractors가 걸러내야 하는 상황이
 * 불필요하게 늘어난다 — 파라미터 범위로 미리 막아둔다.
 */
function buildArithmetic(rand: () => number): Built {
  const ascending = rand() < 0.5;
  const start = ascending ? pickInt(rand, 2, 20) : pickInt(rand, 80, 99);
  const step = ascending ? pickInt(rand, 2, 12) : -pickInt(rand, 2, 12);

  const terms: number[] = [];
  for (let i = 0; i < 6; i++) terms.push(start + i * step);
  const last = terms[5] as number;
  const answer = last + step;

  // step이 음수일 때 "${last} + ${step}"을 그대로 쓰면 "41 + -9 = 32"처럼 어색하게 찍힌다.
  // size.ts가 커집니다/작아집니다로 방향을 말로 나누듯, 여기도 더해집니다/빠집니다로
  // 나누고 빠지는 쪽은 절댓값을 써서 부호가 겹치지 않게 한다.
  const explanation =
    step > 0
      ? `앞의 수에 ${step}씩 더해집니다. ${last} + ${step} = ${answer}.`
      : `앞의 수에서 ${-step}씩 빠집니다. ${last} - ${-step} = ${answer}.`;

  return {
    terms,
    answer,
    // 한 칸 덜 감 / 두 칸 감(계산을 두 번 적용) / 계산 실수(±1)
    candidates: [last, answer + step, answer + 1, answer - 1],
    explanation,
  };
}

/** 등비수열. 6항이면 오답 후보가 8748까지 올라가 9999에 너무 가까워지므로 5항으로 안전 마진을 둔다. */
function buildGeometric(rand: () => number): Built {
  const start = pickInt(rand, 1, 4);
  const ratio = pickInt(rand, 2, 3);

  const terms: number[] = [];
  for (let i = 0; i < 5; i++) terms.push(start * ratio ** i);
  const last = terms[4] as number;
  const answer = last * ratio;

  return {
    terms,
    answer,
    // 곱하는 대신 더함 / 한 칸 덜 감 / 한 칸 더 감(과잉 계산)
    candidates: [last + ratio, last, answer * ratio, answer + last],
    explanation: `앞의 수에 ${ratio}씩 곱해집니다. ${last} × ${ratio} = ${answer}.`,
  };
}

function buildFibonacci(rand: () => number): Built {
  // a === b이면 처음 두 항이 같아진다(예: 4, 4, 8, 12, 20, 32) — 첫 항부터
  // 중복이라 오타처럼 보인다. 세 번째 항부터는 두 양수를 더해 나가므로 항상
  // 이전 항보다 커진다 — 그래서 막아야 할 충돌은 a === b 하나뿐이다.
  let a = 0;
  let b = 0;
  do {
    a = pickInt(rand, 1, 6);
    b = pickInt(rand, 1, 6);
  } while (a === b);

  const terms: number[] = [a, b];
  for (let i = 2; i < 6; i++) {
    terms.push((terms[i - 1] as number) + (terms[i - 2] as number));
  }
  const last = terms[5] as number;
  const prev = terms[4] as number;
  const answer = last + prev;

  return {
    terms,
    answer,
    // 마지막 항의 2배로 착각 / 한 칸 덜 감 / 두 항의 차이를 (합 대신) 더함
    candidates: [last * 2, last, last + (last - prev), answer + prev],
    explanation: `앞의 두 수를 더하면 다음 수가 됩니다. ${prev} + ${last} = ${answer}.`,
  };
}

function hasAdjacentDuplicate(values: readonly number[]): boolean {
  for (let i = 1; i < values.length; i++) {
    if (values[i] === values[i - 1]) return true;
  }
  return false;
}

/**
 * 교대수열. 서로 다른 두 등차수열을 한 칸씩 번갈아 배치한다.
 *
 * stepA === stepB이면 전체가 그냥 하나의 등차수열로 퇴화한다(짝수 인덱스와
 * 홀수 인덱스의 공차가 같아지는 순간, 사실상 공차가 일정한 하나의 수열이
 * 되어버린다). 그러면 해설이 "한 칸 건너뛴 수끼리 묶어서 보세요"라고
 * 말하는데 화면엔 평범한 등차수열이 있는 모순이 생긴다.
 *
 * startA !== startB만으로는 부족하다 — 두 줄이 서로 다르게 시작해도, 예를
 * 들어 startB === startA + stepA처럼 한 줄의 중간 항이 다른 줄의 항과
 * 우연히 같아질 수 있다(실측: 500시드 중 18개, 예: 4,12,12,16,20,20). 그래서
 * 파라미터 조건을 더 늘어놓는 대신, 완성된 6항 배열 자체에서 "인접한 두 항이
 * 같은가"를 직접 검사해 걸리면 재시도한다 — 어떤 조합으로 충돌이 나든 다 잡힌다.
 *
 * 정답(7번째 항)도 검사 대상에 넣어야 한다 — 화면엔 6항까지만 찍히지만, 정답은
 * 그 수열의 논리적인 다음 항이라 같은 "인접 중복은 오타처럼 보인다"는 이유가
 * 그대로 적용된다. 실제로 500시드 중 5개는 6항끼리는 안 겹치는데 마지막 항(B줄)과
 * 정답(A줄)이 우연히 같았다(예: 6,5,11,13,16,21에서 정답도 21). 그래서 재시도
 * 조건에 정답까지 포함한 7항 배열을 넣는다.
 */
function buildAlternating(rand: () => number): Built {
  let startA = 0;
  let startB = 0;
  let stepA = 0;
  let stepB = 0;
  let terms: number[] = [];
  let answer = 0;
  do {
    startA = pickInt(rand, 2, 15);
    startB = pickInt(rand, 2, 15);
    stepA = pickInt(rand, 2, 8);
    stepB = pickInt(rand, 2, 8);
    terms = [
      startA,
      startB,
      startA + stepA,
      startB + stepB,
      startA + 2 * stepA,
      startB + 2 * stepB,
    ];
    answer = startA + 3 * stepA;
  } while (stepA === stepB || hasAdjacentDuplicate([...terms, answer]));

  const last = terms[5] as number;

  return {
    terms,
    answer,
    // 같은 줄이 아니라 바로 앞 항에 규칙을 적용 / 다른 줄의 다음 값
    candidates: [last + stepA, last + stepB, answer + stepA, answer - stepA],
    explanation:
      `한 칸 건너뛴 수끼리 묶어서 보세요. ${terms[0]}, ${terms[2]}, ${terms[4]}는 ${stepA}씩 늘어납니다. ` +
      `다음은 ${answer}.`,
  };
}

function buildSquare(rand: () => number): Built {
  const k = pickInt(rand, 0, 3);

  const terms: number[] = [];
  for (let n = 1; n <= 6; n++) terms.push((n + k) ** 2);
  const last = terms[5] as number;
  const base = 7 + k; // 화면에 없는, 정답이 되는 다음 항의 밑
  const answer = base * base;

  return {
    terms,
    answer,
    // 마지막 제곱수 + 다음 밑 / 한 칸 덜 감 / 제곱 대신 곱셈 실수(밑을 2 더 건너뜀)
    candidates: [last + base, last, (base + 2) ** 2, answer + base],
    explanation: `1², 2², 3² … 제곱수입니다. ${base}² = ${answer}.`,
  };
}

/**
 * 규칙 5종을 균등하게 고른다. 등차는 증가/감소 두 방향을 안에서 다시
 * 나누므로(buildArithmetic), 규칙 선택 자체는 5종만 다룬다.
 */
const BUILDERS: ReadonlyArray<(rand: () => number) => Built> = [
  buildArithmetic,
  buildGeometric,
  buildFibonacci,
  buildAlternating,
  buildSquare,
];

export const sequenceGenerator: Generator = {
  id: 'sequence',
  difficulty: 2,

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
      id: `iq-sequence-${seed}`,
      kind: 'scored',
      prompt: `다음 수열에서 ?에 들어갈 수는?\n\n${terms.join(', ')}, ?`,
      choices: options.map((n) => ({ text: String(n) })),
      answerIndex,
      explanation,
      difficulty: 2,
    };

    return { question, generatorId: 'sequence', seed };
  },
};
