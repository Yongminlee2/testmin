import { sequenceGenerator as G } from '@/engine/iq/generators/sequence';
import { verifyGenerated } from '@/engine/iq/verify';
import type { Question } from '@/engine/types';

// ---------------------------------------------------------------------------
// 테스트 전용 독립 판정기. 생성기의 내부 코드를 재사용하지 않는다 — 재사용하면
// "생성기가 스스로 맞다고 우기는지" 확인하는 동어반복이 되어 예측 대조의
// 의미가 사라진다. 여기서는 오직 화면에 찍힌 항들(prompt에서 파싱)만 보고
// 규칙을 역산한다.
// ---------------------------------------------------------------------------

/** prompt 두 번째 줄의 "term, term, …, ?"에서 숫자만 뽑아낸다. */
function termsOf(question: Question): number[] {
  const m = question.prompt.match(/\n\n(.+), \?$/);
  if (!m) throw new Error(`수열을 prompt에서 파싱할 수 없습니다: ${question.prompt}`);
  return (m[1] as string).split(', ').map(Number);
}

function isSquareSeq(t: readonly number[]): boolean {
  if (t.length < 1) return false;
  return t.every((n) => {
    const base = Math.round(Math.sqrt(n));
    return base * base === n;
  });
}

function isFibonacciSeq(t: readonly number[]): boolean {
  if (t.length < 3) return false;
  for (let i = 2; i < t.length; i++) {
    if (t[i] !== (t[i - 1] as number) + (t[i - 2] as number)) return false;
  }
  return true;
}

/** 연속한 두 항의 비가 전체에서 일정한가. 부동소수 나눗셈 대신 교차곱으로 비교한다. */
function isGeometricSeq(t: readonly number[]): boolean {
  if (t.length < 3) return false;
  const t0 = t[0] as number;
  const t1 = t[1] as number;
  if (t0 === 0 || t1 === t0) return false;
  for (let i = 1; i < t.length; i++) {
    if ((t[i] as number) * t0 !== (t[i - 1] as number) * t1) return false;
  }
  return true;
}

function isArithmeticSeq(t: readonly number[]): boolean {
  if (t.length < 2) return false;
  const step = (t[1] as number) - (t[0] as number);
  for (let i = 1; i < t.length; i++) {
    if ((t[i] as number) - (t[i - 1] as number) !== step) return false;
  }
  return true;
}

/**
 * 한 칸 건너뛴 값들끼리(짝수 인덱스/홀수 인덱스) 각각 공차가 일정한가.
 * 두 공차가 같으면(stepA === stepB) 전체가 그냥 하나의 등차수열이 되어버리므로
 * 그 경우는 교대로 치지 않는다 — 이게 등차수열과 교대수열이 서로 배타적이게
 * 만드는 핵심 조건이다(브리프의 "생성기 쪽 가드"와 대칭되는 판정 쪽 가드).
 */
function isAlternatingSeq(t: readonly number[]): boolean {
  if (t.length < 4 || t.length % 2 !== 0) return false;
  const evens = t.filter((_, i) => i % 2 === 0);
  const odds = t.filter((_, i) => i % 2 === 1);
  const stepA = (evens[1] as number) - (evens[0] as number);
  const stepB = (odds[1] as number) - (odds[0] as number);
  for (let i = 1; i < evens.length; i++) {
    if ((evens[i] as number) - (evens[i - 1] as number) !== stepA) return false;
  }
  for (let i = 1; i < odds.length; i++) {
    if ((odds[i] as number) - (odds[i - 1] as number) !== stepB) return false;
  }
  return stepA !== stepB;
}

const ALL_RULES: ReadonlyArray<{ id: string; matches: (t: readonly number[]) => boolean }> = [
  // 판정 순서: 제곱 → 피보나치 → 등비 → 등차 → 교대.
  // 등차가 교대보다 먼저 와야 한다 — 등차수열은 항상 교대수열의 형태도 만족하기 때문이다.
  { id: 'square', matches: isSquareSeq },
  { id: 'fibonacci', matches: isFibonacciSeq },
  { id: 'geometric', matches: isGeometricSeq },
  { id: 'arithmetic', matches: isArithmeticSeq },
  { id: 'alternating', matches: isAlternatingSeq },
];

function classify(t: readonly number[]): string {
  for (const rule of ALL_RULES) {
    if (rule.matches(t)) return rule.id;
  }
  throw new Error(`분류할 수 없는 수열입니다: ${t.join(',')}`);
}

function predictNext(t: readonly number[]): number {
  const n = t.length;
  switch (classify(t)) {
    case 'square': {
      const nextBase = Math.round(Math.sqrt(t[n - 1] as number)) + 1;
      return nextBase * nextBase;
    }
    case 'fibonacci':
      return (t[n - 1] as number) + (t[n - 2] as number);
    case 'geometric': {
      const ratio = (t[1] as number) / (t[0] as number);
      return (t[n - 1] as number) * ratio;
    }
    case 'arithmetic': {
      const step = (t[1] as number) - (t[0] as number);
      return (t[n - 1] as number) + step;
    }
    case 'alternating': {
      const evens = t.filter((_, i) => i % 2 === 0);
      const stepA = (evens[1] as number) - (evens[0] as number);
      return (evens[evens.length - 1] as number) + stepA;
    }
    /* istanbul ignore next */
    default:
      throw new Error('classify가 알 수 없는 종류를 반환했습니다');
  }
}

describe('sequenceGenerator', () => {
  test('같은 시드는 같은 문항을 만든다', () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(JSON.stringify(G.generate(seed))).toBe(JSON.stringify(G.generate(seed)));
    }
  });

  test('시드 500개에서 항상 검증을 통과한다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const errors = verifyGenerated(G.generate(seed));
      if (errors.length > 0) throw new Error(`seed ${seed}: ${errors.join(' / ')}`);
    }
  });

  // ② 공통 요구의 "시각적 유효성"이 수열에서는 숫자 크기로 나타난다.
  test('제시된 항과 선택지가 모두 1~9999 정수다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = G.generate(seed);
      const nums = [...termsOf(question), ...question.choices.map((c) => Number(c.text))];
      for (const n of nums) {
        expect(Number.isInteger(n)).toBe(true);
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(9999);
      }
    }
  });

  // ★ ① 예측 대조 — 생성기의 파라미터를 읽지 않는다. 제시된 항들만 보고
  // 규칙을 역산해 다음 항을 독립적으로 계산한 뒤 표시된 정답과 비교한다.
  test('표시된 정답이 제시된 항에서 역산한 다음 항과 일치한다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = G.generate(seed);
      const t = termsOf(question);
      const marked = Number(question.choices[question.answerIndex ?? -1]?.text);
      expect(marked).toBe(predictNext(t));
    }
  });

  // 다섯 규칙이 전부 나오는가. 하나가 죽어도 나머지로 통과해버리면 안 된다.
  test('시드 500개에서 다섯 규칙이 모두 출제된다', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 500; seed++) {
      seen.add(classify(termsOf(G.generate(seed).question)));
    }
    expect(seen).toEqual(new Set(['arithmetic', 'geometric', 'fibonacci', 'alternating', 'square']));
  });

  // 한 수열이 두 규칙에 동시에 해당하면 해설이 설명하는 규칙과 사용자가
  // 읽어낸 규칙이 달라질 수 있다. 교대의 stepA !== stepB 가드가 이걸 막는다.
  // 판정 순서에 기대는 대신 "겹침이 아예 없다"를 직접 검사한다.
  test('어떤 시드에서도 두 규칙에 동시에 해당하지 않는다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const t = termsOf(G.generate(seed).question);
      const matches = ALL_RULES.filter((r) => r.matches(t));
      if (matches.length !== 1) {
        throw new Error(`seed ${seed}: ${matches.map((r) => r.id).join('+') || '(없음)'} — ${t.join(',')}`);
      }
    }
  });

  // pickDistractors가 후보를 걸러내고 정답 근처 값(±1·±2)으로 메우는 비율이
  // 너무 높으면 파라미터 범위가 잘못된 것이다.
  test('교육적 오답이 근처 숫자로 대체된 비율이 20% 미만이다', () => {
    let filled = 0;
    let total = 0;
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = G.generate(seed);
      const answer = Number(question.choices[question.answerIndex ?? -1]?.text);
      for (const c of question.choices) {
        const n = Number(c.text);
        if (n === answer) continue;
        total++;
        if (Math.abs(n - answer) <= 2) filled++;
      }
    }
    expect(filled / total).toBeLessThan(0.2);
  });

  // ③ 해설 내용 — 비어 있지 않은지가 아니라, 제시된 항에서 역산한 값을
  // 실제로 담고 있는지 확인한다. 생성기 내부 변수를 재사용하면 동어반복이므로
  // 이 테스트도 termsOf()로 다시 읽은 값에서 직접 계산한다.
  test('해설이 제시된 항에서 역산한 값을 실제로 언급한다', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const { question } = G.generate(seed);
      const t = termsOf(question);
      const kind = classify(t);
      const last = t[t.length - 1] as number;
      const explanation = question.explanation ?? '';
      const answer = predictNext(t);

      expect(explanation).toContain(String(answer));

      switch (kind) {
        case 'arithmetic': {
          const step = (t[1] as number) - (t[0] as number);
          expect(explanation).toContain(String(step));
          expect(explanation).toContain(String(last));
          break;
        }
        case 'geometric': {
          const ratio = (t[1] as number) / (t[0] as number);
          expect(explanation).toContain(String(ratio));
          expect(explanation).toContain(String(last));
          break;
        }
        case 'fibonacci': {
          const prev = t[t.length - 2] as number;
          expect(explanation).toContain(String(prev));
          expect(explanation).toContain(String(last));
          break;
        }
        case 'alternating': {
          const evens = t.filter((_, i) => i % 2 === 0);
          const stepA = (evens[1] as number) - (evens[0] as number);
          expect(explanation).toContain(String(stepA));
          for (const e of evens) expect(explanation).toContain(String(e));
          break;
        }
        case 'square': {
          const nextBase = Math.round(Math.sqrt(last)) + 1;
          expect(explanation).toContain(String(nextBase));
          break;
        }
        default:
          throw new Error(`알 수 없는 종류: ${kind}`);
      }
    }
  });
});
