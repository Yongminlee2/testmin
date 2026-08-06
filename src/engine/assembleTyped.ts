import { mulberry32, shuffle } from './rng';
import { AXES, type Question } from './types';

export interface AssembleTypedOptions {
  /** 각 축에서 뽑을 문항 수 */
  readonly perAxis: number;
  /** 최근에 나온 문항 ID. 완전 배제가 아니라 후순위로 민다. */
  readonly excludeIds?: readonly string[];
}

/**
 * 축 균형 출제 (성격 16유형).
 *
 * 정답형 assemble과 의도적으로 다른 점:
 * - 축이 부족해도 다른 축에서 채우지 않는다. 축 균형이 깨진 결과는 무의미하다.
 * - 선택지를 섞지 않는다. 리커트 척도는 순서 자체가 의미를 갖는다.
 */
export function assembleByAxis(
  pool: readonly Question[],
  seed: number,
  options: AssembleTypedOptions
): Question[] {
  const { perAxis, excludeIds } = options;
  if (pool.length === 0) {
    console.warn('[assembleByAxis] 문항 풀이 비어 있습니다');
    return [];
  }

  const rand = mulberry32(seed);
  const recent = new Set(excludeIds ?? []);
  const picked: Question[] = [];

  for (const axis of AXES) {
    const inAxis = pool.filter((q) => q.axis === axis);
    const fresh = shuffle(inAxis.filter((q) => !recent.has(q.id)), rand);
    const stale = shuffle(inAxis.filter((q) => recent.has(q.id)), rand);
    const ordered = [...fresh, ...stale];

    if (ordered.length < perAxis) {
      console.warn(
        `[assembleByAxis] ${axis} 축 문항이 부족합니다: ${ordered.length}개로 ${perAxis}개를 출제하려 합니다. 다른 축에서 채우지 않습니다.`
      );
    }

    picked.push(...ordered.slice(0, perAxis));
  }

  return shuffle(picked, rand);
}
