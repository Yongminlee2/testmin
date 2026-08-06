import { AXES, AXIS_LETTERS, type AxisKey, type AxisResult, type AxisScore, type Question } from './types';
import type { Answer } from './score';

/**
 * 축 합계 방식 채점 (성격 16유형).
 * 축별로 선택지 가중치를 더하고 부호로 글자를 정한다.
 * 합계가 0이면 그 축의 마지막 응답 방향을 따르고 wasTie를 세운다.
 */
export function scoreByAxis(
  questions: readonly Question[],
  answers: readonly Answer[]
): AxisResult {
  const chosenById = new Map<string, number>();
  for (const a of answers) chosenById.set(a.questionId, a.chosenIndex);

  const axes: AxisScore[] = AXES.map((axis) => {
    const inAxis = questions.filter((q) => q.axis === axis);

    let total = 0;
    let count = 0;
    let lastWeight = 0;

    for (const q of inAxis) {
      const chosenIndex = chosenById.get(q.id);
      if (chosenIndex === undefined || chosenIndex < 0) continue;
      const weight = q.choices[chosenIndex]?.weight;
      if (typeof weight !== 'number') continue;
      total += weight;
      count += 1;
      lastWeight = weight;
    }

    const letters = AXIS_LETTERS[axis];
    const wasTie = total === 0;
    const direction = wasTie ? lastWeight : total;
    const letter = direction > 0 ? letters.positive : letters.negative;

    // 축에 응답이 하나도 없으면 count가 0이라 percent 계산이 0으로 나눠진다.
    const maxPossible = count * 2;
    const percent =
      maxPossible === 0 ? 50 : Math.round(Math.min(100, Math.max(0, 50 + (Math.abs(total) / maxPossible) * 50)));

    return { axis, total, letter, percent, wasTie };
  });

  return { code: axes.map((a) => a.letter).join(''), axes };
}
