import { validateScoredQuestions } from '../../tools/validate-content';
import type { Question } from '@/engine/types';
import gyeongsang from '@/content/dialect/gyeongsang.json';
import { DIALECT_DRAW } from '@/content/registry';

const questions = gyeongsang as unknown as Question[];

describe('경상도 사투리 문항', () => {
  test('검증 스크립트를 통과한다', () => {
    expect(validateScoredQuestions(questions, { expectedChoiceCount: 4 })).toEqual([]);
  });

  test('출제 수(12)보다 충분히 많은 풀을 가진다', () => {
    expect(questions.length).toBeGreaterThanOrEqual(15);
  });

  test('난이도별로 실제 출제(DIALECT_DRAW)가 요구하는 만큼 문항이 있다', () => {
    for (const d of [1, 2, 3] as const) {
      const need = DIALECT_DRAW.difficultyMix[d] ?? 0;
      expect(questions.filter((q) => q.difficulty === d).length).toBeGreaterThanOrEqual(need);
    }
  });

  test('모든 문항이 scored이고 검증 근거를 남긴다', () => {
    for (const q of questions) {
      expect(q.kind).toBe('scored');
      expect(q.source && q.source.length).toBeGreaterThan(0);
    }
  });

  test('ID 규칙을 지킨다', () => {
    for (const q of questions) {
      expect(q.id).toMatch(/^dialect-gs-\d{4}$/);
    }
  });
});
