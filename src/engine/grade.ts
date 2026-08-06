import type { GradeBand } from './types';

/**
 * 정답률로 급수를 정한다.
 * bands는 min 기준 내림차순이어야 하며, 마지막 밴드의 min은 0이어야 한다.
 * total이 0이면 최하 밴드를 돌려준다.
 */
export function gradeFor(
  correct: number,
  total: number,
  bands: readonly GradeBand[]
): GradeBand {
  const last = bands[bands.length - 1];
  if (last === undefined) {
    throw new Error('급수 테이블이 비어 있습니다');
  }
  if (total <= 0) return last;

  const percent = (correct / total) * 100;
  for (const band of bands) {
    if (percent >= band.min) return band;
  }
  return last;
}
