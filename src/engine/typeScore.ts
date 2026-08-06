import { AXES, AXIS_LETTERS, type AxisKey, type AxisResult, type AxisScore, type Question, type VoteResult } from './types';
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

/**
 * 최다 득표 방식 채점 (심리 테스트).
 * 선택지마다 typeId에 1표. 동점이면 뒤쪽 문항에서 득표한 유형이 이긴다
 * (뒤쪽에 변별력 높은 문항을 배치한다는 전제).
 */
export function scoreByVote(
  questions: readonly Question[],
  answers: readonly Answer[],
  typeIds: readonly string[]
): VoteResult {
  const chosenById = new Map<string, number>();
  for (const a of answers) chosenById.set(a.questionId, a.chosenIndex);

  const tally: Record<string, number> = {};
  for (const t of typeIds) tally[t] = 0;

  /** 각 유형이 마지막으로 득표한 문항 순번. 동점 판정에 쓴다. */
  const lastVotedAt: Record<string, number> = {};

  questions.forEach((q, i) => {
    const chosenIndex = chosenById.get(q.id);
    if (chosenIndex === undefined || chosenIndex < 0) return;
    const typeId = q.choices[chosenIndex]?.typeId;
    if (typeId === undefined) return;
    tally[typeId] = (tally[typeId] ?? 0) + 1;
    lastVotedAt[typeId] = i;
  });

  let best = typeIds[0] ?? '';
  let bestCount = -1;
  let bestAt = -1;
  let tied = false;

  for (const t of typeIds) {
    const count = tally[t] ?? 0;
    const at = lastVotedAt[t] ?? -1;
    if (count > bestCount) {
      best = t;
      bestCount = count;
      bestAt = at;
      tied = false;
    } else if (count === bestCount) {
      tied = true;
      if (at > bestAt) {
        best = t;
        bestAt = at;
      }
    }
  }

  return { typeId: best, tally, wasTie: tied };
}
