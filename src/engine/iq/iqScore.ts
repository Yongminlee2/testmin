import { scoreTest } from '../score';
import type { Answer, ScoredResult } from '../score';
import type { GradeBand, Question } from '../types';

/**
 * 이 문구는 결과 타입의 **필수 필드**다. 선택 필드로 두면 화면이 빼먹어도 타입이 통과한다.
 * 실제 지능검사가 아닌 것을 점수처럼 보여주는 이상, 문구가 빠진 화면은 그 자체로 결함이다.
 */
export const IQ_DISCLAIMER =
  '이 점수는 실제 지능검사 결과가 아닙니다. 표준화된 규준 표본 없이 정답률을 ' +
  '점수 구간에 그대로 대응시킨 값이라, 재미로만 봐주세요.';

/** 정답률 0%가 70, 100%가 145. 사이는 선형. */
export const IQ_SCORE_MIN = 70;
export const IQ_SCORE_MAX = 145;

export interface IqResult extends ScoredResult {
  /** 추정 점수. 규준 표본 근거 없음 — IQ_DISCLAIMER를 함께 보여줄 것. */
  readonly estimatedScore: number;
  /** 화면이 반드시 함께 표시해야 하는 문구. 필수 필드다. */
  readonly disclaimer: string;
}

export function estimateIqScore(percent: number): number {
  const safe = Number.isFinite(percent) ? percent : 0;
  const clamped = Math.max(0, Math.min(100, safe));
  return Math.round(IQ_SCORE_MIN + (clamped / 100) * (IQ_SCORE_MAX - IQ_SCORE_MIN));
}

export function scoreIq(
  questions: readonly Question[],
  answers: readonly Answer[],
  bands: readonly GradeBand[]
): IqResult {
  const base = scoreTest(questions, answers, bands);
  return {
    ...base,
    estimatedScore: estimateIqScore(base.percent),
    disclaimer: IQ_DISCLAIMER,
  };
}
