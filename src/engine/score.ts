import { gradeFor } from './grade';
import type { GradeBand, Question } from './types';

export interface Answer {
  readonly questionId: string;
  /** 미응답은 -1 */
  readonly chosenIndex: number;
}

export interface WrongItem {
  readonly questionId: string;
  readonly chosenIndex: number;
  readonly answerIndex: number;
}

export interface ScoredResult {
  readonly total: number;
  readonly correct: number;
  readonly percent: number;
  readonly grade: number;
  readonly title: string;
  readonly wrong: readonly WrongItem[];
}

/**
 * 정답형 채점.
 * answerIndex가 없는 문항은 채점 대상에서 제외한다(유형형 문항이 섞여도 안전).
 * 응답이 없는 문항은 오답으로 처리하고 chosenIndex를 -1로 남긴다.
 */
export function scoreTest(
  questions: readonly Question[],
  answers: readonly Answer[],
  bands: readonly GradeBand[]
): ScoredResult {
  const chosenById = new Map<string, number>();
  for (const a of answers) chosenById.set(a.questionId, a.chosenIndex);

  const scorable = questions.filter((q) => typeof q.answerIndex === 'number');
  const wrong: WrongItem[] = [];
  let correct = 0;

  for (const q of scorable) {
    const answerIndex = q.answerIndex as number;
    const chosenIndex = chosenById.get(q.id) ?? -1;
    if (chosenIndex === answerIndex) {
      correct += 1;
    } else {
      wrong.push({ questionId: q.id, chosenIndex, answerIndex });
    }
  }

  const total = scorable.length;
  const percent = total === 0 ? 0 : (correct / total) * 100;
  const band = gradeFor(correct, total, bands);

  return { total, correct, percent, grade: band.grade, title: band.title, wrong };
}
