import { assemble } from '@/engine/assemble';
import { scoreTest } from '@/engine/score';
import { canonicalizeWrongItems, restoreQuestion } from '@/store/history';
import { GENERATORS } from '@/engine/iq/generators';
import { POOLS, POOL_SCORING } from '@/content/registry';
import type { GradeBand } from '@/engine/types';
import type { WrongNote } from '@/engine/notes';

const bands: readonly GradeBand[] = [{ min: 0, grade: 1, title: '검증용' }];

function noteFor(
  testId: string,
  variant: string,
  item: { readonly questionId: string; readonly chosenIndex: number; readonly answerIndex: number }
): WrongNote {
  return {
    testId,
    variant,
    ...item,
    choiceOrder: 'canonical',
    addedAt: 1,
  };
}

describe('선택 → 채점 → 오답노트 왕복', () => {
  for (const [poolId, pool] of Object.entries(POOLS)) {
    if (POOL_SCORING[poolId] !== 'scored') continue;
    const [testId, variant] = poolId.split(':') as [string, string];

    test(`${poolId}: 모든 문항과 보기가 누른 인덱스대로 채점·복원된다`, () => {
      // 여러 시드로 선택지 순열을 바꿔 같은 검사를 반복한다.
      for (let seed = 1; seed <= 12; seed += 1) {
        const displayed = assemble(pool, seed, { count: pool.length });
        const allCorrect = displayed.map((question) => ({
          questionId: question.id,
          chosenIndex: question.answerIndex as number,
        }));
        expect(scoreTest(displayed, allCorrect, bands).correct).toBe(displayed.length);

        for (const question of displayed) {
          const answerIndex = question.answerIndex as number;

          for (let chosenIndex = 0; chosenIndex < question.choices.length; chosenIndex += 1) {
            const result = scoreTest(
              [question],
              [{ questionId: question.id, chosenIndex }],
              bands
            );
            expect(result.correct).toBe(chosenIndex === answerIndex ? 1 : 0);
          }

          const chosenIndex = answerIndex === 0 ? 1 : 0;
          const normalized = canonicalizeWrongItems(testId, variant, displayed, [
            { questionId: question.id, chosenIndex, answerIndex },
          ]);
          expect(normalized).toHaveLength(1);

          const item = normalized[0];
          if (item === undefined) throw new Error('오답 정규화 실패');
          const restored = restoreQuestion(noteFor(testId, variant, item));
          expect(restored).toBeDefined();
          expect(restored?.choices[item.chosenIndex]).toEqual(question.choices[chosenIndex]);
          expect(restored?.choices[item.answerIndex]).toEqual(question.choices[answerIndex]);
        }
      }
    });
  }

  test('IQ 생성 문항도 모든 생성기에서 선택·채점·오답 복원이 일치한다', () => {
    for (const generator of GENERATORS) {
      for (let seed = 1; seed <= 40; seed += 1) {
        const question = generator.generate(seed).question;
        const answerIndex = question.answerIndex as number;
        expect(
          scoreTest(
            [question],
            [{ questionId: question.id, chosenIndex: answerIndex }],
            bands
          ).correct
        ).toBe(1);

        const chosenIndex = answerIndex === 0 ? 1 : 0;
        const normalized = canonicalizeWrongItems('iq', 'default', [question], [
          { questionId: question.id, chosenIndex, answerIndex },
        ]);
        const item = normalized[0];
        if (item === undefined) throw new Error(`${generator.id} 오답 정규화 실패`);
        const restored = restoreQuestion(noteFor('iq', 'default', item));
        expect(restored?.choices[item.chosenIndex]).toEqual(question.choices[chosenIndex]);
        expect(restored?.choices[item.answerIndex]).toEqual(question.choices[answerIndex]);
      }
    }
  });
});
