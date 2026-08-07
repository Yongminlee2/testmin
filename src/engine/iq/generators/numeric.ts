import { shuffle } from '../../rng';

/**
 * 수열 생성기들이 공유하는 부품. sequence(난이도 2)와 hardsequence(난이도 3)는
 * 규칙만 다르고 "정답 + 그럴듯한 오답 4개를 고른다"는 절차가 같다.
 */

/** 선택지 버튼이 화면을 넘치지 않는 상한. 항·선택지 모두 이 안에 들어와야 한다. */
export const MAX = 9999;

export interface Built {
  readonly terms: readonly number[];
  readonly answer: number;
  readonly candidates: readonly number[];
  readonly explanation: string;
}

/**
 * 규칙에서 나온 "그럴듯한 오답" 후보를 받아 정답과 다른 4개를 고른다.
 * 후보가 모자라면 정답 ±k로 채운다 — 교육적이진 않지만 5지선다는 채워야 한다.
 * 상한(9999)을 넘는 값은 버린다. 선택지 버튼이 화면을 넘치기 때문이다.
 */
export function pickDistractors(
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
