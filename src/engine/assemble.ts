import { mulberry32, shuffle } from './rng';
import type { Difficulty, Question } from './types';

export interface AssembleOptions {
  readonly count: number;
  /** 난이도별 목표 개수. 합이 count와 달라도 count가 우선한다. */
  readonly difficultyMix?: Partial<Record<Difficulty, number>>;
  /** 최근에 나온 문항 ID. 완전 배제가 아니라 후순위로 민다. */
  readonly excludeIds?: readonly string[];
}

/**
 * 문항 풀에서 출제 세트를 만든다.
 * 같은 시드는 항상 같은 결과를 준다.
 */
export function assemble(
  pool: readonly Question[],
  seed: number,
  options: AssembleOptions
): Question[] {
  const { count, difficultyMix, excludeIds } = options;
  if (pool.length === 0) {
    console.warn('[assemble] 문항 풀이 비어 있습니다');
    return [];
  }

  const rand = mulberry32(seed);
  const recent = new Set(excludeIds ?? []);

  // 최근에 안 나온 것을 앞으로, 각 그룹 안에서는 시드로 섞는다.
  const fresh = shuffle(pool.filter((q) => !recent.has(q.id)), rand);
  const stale = shuffle(pool.filter((q) => recent.has(q.id)), rand);
  const ordered = [...fresh, ...stale];

  const picked: Question[] = [];
  const used = new Set<string>();

  const take = (candidates: readonly Question[], want: number): void => {
    for (const q of candidates) {
      if (picked.length >= count || want <= 0) return;
      if (used.has(q.id)) continue;
      picked.push(q);
      used.add(q.id);
      want -= 1;
    }
  };

  // 1단계: 난이도 분포를 먼저 채운다.
  if (difficultyMix) {
    for (const key of [1, 2, 3] as const) {
      const want = difficultyMix[key] ?? 0;
      if (want > 0) take(ordered.filter((q) => q.difficulty === key), want);
    }
  }

  // 2단계: 남은 자리를 난이도 무관하게 채운다.
  take(ordered, count - picked.length);

  // 3단계: 풀이 모자라면 중복을 허용한다.
  if (picked.length < count) {
    console.warn(
      `[assemble] 풀이 부족합니다: ${pool.length}개로 ${count}개를 출제하려 해 중복을 허용합니다`
    );
    let i = 0;
    while (picked.length < count) {
      picked.push(ordered[i % ordered.length] as Question);
      i += 1;
    }
  }

  return shuffle(picked, rand);
}
